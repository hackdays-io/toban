/**
 * `POST /api/mcp-tokens/revoke` — per-token revocation.
 *
 * This is the whole point of the `tbn2` two-stage design (`auth.ts`): the
 * `tbn1` predecessor could only be revoked all-or-nothing by rotating the
 * shared secret. Authorised the same way as issuance/listing
 * (`handlers/auth.ts`: wallet must wear the workspace's operator or top
 * hat), but with the `McpTokenRevokeRequest` message — distinct from
 * `McpTokenListRequest` precisely so a signature produced to authorise
 * listing can never be replayed here (see `eip712/mcp-token.ts`'s module
 * doc for the vulnerability this closes).
 *
 * **Revocation burns its nonce at the very end — after the hat check and
 * after `revokeToken` — not right after signature verification like
 * issuance does.** That difference is deliberate, not an oversight:
 * revocation is idempotent (revoking an already-revoked token is a no-op,
 * see `registry.ts`'s `revokeToken`), so the failure mode that made
 * issuance's early burn necessary — several concurrent replays of one
 * captured signature each minting a *distinct* valid token — has no
 * analogue here; two concurrent replays of a revoke both just revoke the
 * same token once. Burning earlier would only add a new bad outcome: a
 * revoke that fails after the burn (e.g. the hat check, or a transient D1
 * error before `revokeToken`) would permanently spend the nonce for a
 * token that was never actually revoked, with no way to retry using the
 * same signature. Burning at the end means only a request that actually
 * completed the revoke consumes its nonce.
 *
 * `tokenId` is read from the verified, signed message itself
 * (`parsed.typedData.message.tokenId`), never from an unsigned top-level
 * body field — otherwise the signature would authenticate "this wallet may
 * revoke *something*" without committing to *what*, and a captured
 * signature could be replayed against any tokenId the attacker chooses.
 */
import { MCP_TOKEN_REVOKE_PRIMARY_TYPE } from "../eip712/mcp-token.js";
import type { Env } from "../env.js";
import { errorResponse, json } from "../http.js";
import {
  type McpDb,
  getToken,
  isAuthNonceUsed,
  markAuthNonceUsed,
  revokeToken,
} from "../registry.js";
import type { HatChecker, RevokeVerifier } from "./auth.js";
import { parseWalletTreeAuthRequest, verifyWalletTreeAuth } from "./auth.js";

export type { HatChecker, RevokeVerifier } from "./auth.js";

export type RevokeHandlerDeps = {
  db: McpDb;
  env: Env;
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
  // Neither read depends on the other's result — both key off values
  // already in hand (`nonce` and `tokenId` from the signed message).
  const [nonceUsed, row] = await Promise.all([
    isAuthNonceUsed(deps.db, nonce),
    getToken(deps.db, tokenId),
  ]);
  if (nonceUsed) {
    return errorResponse(400, "nonce_reused");
  }

  // `verifyWalletTreeAuth` only proves "this wallet may act for
  // auth.treeId" — it says nothing about which tree `tokenId` actually
  // belongs to. Without this check, a wallet authorised for its own
  // workspace could revoke any token id it can guess, regardless of which
  // workspace it belongs to. This is still needed even though `tokenId` is
  // now inside the signed message: the signature proves the wallet may act
  // for the tree, this lookup proves the named token belongs to it.
  if (!row || row.treeId !== auth.treeId) {
    return errorResponse(404, "not_found");
  }

  await revokeToken(deps.db, tokenId, auth.now);
  await markAuthNonceUsed(deps.db, nonce, auth.now);

  return json(200, { ok: true, tokenId });
}
