/**
 * `POST /api/mcp-tokens/revoke` — per-token revocation.
 *
 * This is the whole point of the `tbn2` two-stage design (`auth.ts`): the
 * `tbn1` predecessor could only be revoked all-or-nothing by rotating the
 * shared secret. Authorised the same way as issuance/listing (wallet must
 * wear the workspace's operator or top hat), but with the
 * `McpTokenRevokeRequest` message — distinct from `McpTokenListRequest`
 * precisely so a signature produced to authorise listing can never be
 * replayed here (see `eip712/mcp-token.ts`'s module doc for the
 * vulnerability this closes). And — unlike listing — this **burns the
 * nonce**, because this is a write.
 *
 * `tokenId` is read from the verified, signed message itself
 * (`parsed.typedData.message.tokenId`), never from an unsigned top-level
 * body field — otherwise the signature would authenticate "this wallet may
 * revoke *something*" without committing to *what*, and a captured
 * signature could be replayed against any tokenId the attacker chooses.
 */
import { MCP_TOKEN_REVOKE_PRIMARY_TYPE } from "../eip712/mcp-token.js";
import type { Env } from "../env.js";
import {
  type McpDb,
  getToken,
  isAuthNonceUsed,
  markAuthNonceUsed,
  revokeToken,
} from "../registry.js";
import type { HatChecker, RevokeVerifier } from "./list.js";
import { parseWalletTreeAuthRequest, verifyWalletTreeAuth } from "./list.js";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(status: number, error: string, details?: string) {
  return json(status, details === undefined ? { error } : { error, details });
}

export type RevokeHandlerDeps = {
  db: McpDb;
  env: Env;
  now?: () => number;
  verifySignature?: RevokeVerifier;
  checkHat?: HatChecker;
  fetchImpl?: typeof fetch;
};

export async function handleRevokeToken(
  request: Request,
  deps: RevokeHandlerDeps,
): Promise<Response> {
  if (request.method !== "POST") {
    return errorResponse(405, "method_not_allowed");
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, "invalid_body");
  }

  const parsed = parseWalletTreeAuthRequest(raw, MCP_TOKEN_REVOKE_PRIMARY_TYPE);
  if (!parsed) return errorResponse(400, "invalid_body");

  const auth = await verifyWalletTreeAuth(parsed, deps);
  if (!auth.ok) return auth.response;

  const { nonce, tokenId } = parsed.typedData.message;
  if (await isAuthNonceUsed(deps.db, nonce)) {
    return errorResponse(400, "nonce_reused");
  }

  // `verifyWalletTreeAuth` only proves "this wallet may act for
  // auth.treeId" — it says nothing about which tree `tokenId` actually
  // belongs to. Without this check, a wallet authorised for its own
  // workspace could revoke any token id it can guess, regardless of which
  // workspace it belongs to. This is still needed even though `tokenId` is
  // now inside the signed message: the signature proves the wallet may act
  // for the tree, this lookup proves the named token belongs to it.
  const row = await getToken(deps.db, tokenId);
  if (!row || row.treeId !== auth.treeId) {
    return errorResponse(404, "not_found");
  }

  await revokeToken(deps.db, tokenId, auth.now);
  await markAuthNonceUsed(deps.db, nonce, auth.now);

  return json(200, { ok: true, tokenId });
}
