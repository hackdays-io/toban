/**
 * `POST /api/mcp-tokens/list` — settings-page listing for one workspace.
 *
 * Authorised the same way as issuance and revocation (`handlers/auth.ts`),
 * but with the lighter `McpTokenListRequest` message (no `label`) and
 * **without** burning the nonce: listing has no side effect, so replaying
 * the same signature within its `expires` window is harmless and lets the
 * settings page reuse one signature for the whole session instead of asking
 * for a new wallet popup on every render.
 *
 * This is only safe because `McpTokenListRequest` and `McpTokenRevokeRequest`
 * are now distinct EIP-712 primary types (see `eip712/mcp-token.ts`'s module
 * doc). A `McpTokenListRequest` signature is not a valid signature for a
 * `McpTokenRevokeRequest` message — different `primaryType` means a
 * different struct hash — so replaying a captured list signature against
 * `handleRevokeToken` fails signature verification outright, regardless of
 * whether this handler burns its own nonce. Before that split, both
 * operations shared one message shape and this file's un-burned nonce is
 * exactly what made the list-signature-as-revoke replay possible; see
 * `eip712/mcp-token.ts` for the full history. Do not reunify the two types
 * to "simplify" this file.
 */
import { MCP_TOKEN_LIST_PRIMARY_TYPE } from "../eip712/mcp-token.js";
import type { Env } from "../env.js";
import { errorResponse, json } from "../http.js";
import { type McpDb, listTokensByTree } from "../registry.js";
import type { HatChecker, ListVerifier } from "./auth.js";
import { parseWalletTreeAuthRequest, verifyWalletTreeAuth } from "./auth.js";

export type { HatChecker, ListVerifier } from "./auth.js";

export type ListHandlerDeps = {
  db: McpDb;
  env: Env;
  verifySignature?: ListVerifier;
  checkHat?: HatChecker;
  fetchImpl?: typeof fetch;
};

export async function handleListTokens(
  request: Request,
  deps: ListHandlerDeps,
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
  const parsed = parseWalletTreeAuthRequest(raw, MCP_TOKEN_LIST_PRIMARY_TYPE);
  if (!parsed) return errorResponse(400, "invalid_body");

  const auth = await verifyWalletTreeAuth(parsed, deps);
  if (!auth.ok) return auth.response;

  const rows = await listTokensByTree(deps.db, auth.treeId);
  return json(200, {
    tokens: rows.map((r) => ({
      tokenId: r.tokenId,
      label: r.label,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      revokedAt: r.revokedAt,
    })),
  });
}
