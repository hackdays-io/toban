/**
 * `POST /api/mcp-tokens` — self-service token issuance.
 *
 * Authorization is an EIP-712 wallet signature, not a Privy JWT — the same
 * boundary-contract pattern `@toban/identity` already uses for
 * `IdentityBinding` (`docs/mcp-extraction.md` §5). The Worker, not the
 * frontend, is the one that checks the wallet actually wears the
 * workspace's operator or top hat; the frontend's hat display is UI only.
 *
 * Shares its shape/signature/workspace/hat-check building blocks with
 * `list.ts` and `revoke.ts` via `./auth.js`, but cannot use that module's
 * combined `verifyWalletTreeAuth` the way they do: this handler's nonce burn
 * must land strictly after signature verification and strictly before the
 * workspace-overview read (see the comment at the `markAuthNonceUsed` call
 * below), and `verifyWalletTreeAuth` deliberately fetches the overview
 * *concurrently* with the signature check — there is no seam to splice a
 * burn into partway through that. So issuance calls
 * `validateWalletTreeMessage` / `verifySignatureOutcome` /
 * `resolveOverviewOrNotFound` / `checkHatOrForbidden` directly, in its own
 * order, with the burn between the second and third.
 */
import { generateTokenId, issueToken } from "../auth.js";
import {
  MCP_TOKEN_ISSUE_PRIMARY_TYPE,
  type McpTokenIssueTypedData,
} from "../eip712/mcp-token.js";
import type { Env } from "../env.js";
import { errorResponse, json } from "../http.js";
import { type McpDb, insertToken, markAuthNonceUsed } from "../registry.js";
import {
  type HatChecker,
  type IssueVerifier,
  checkHatOrForbidden,
  defaultWalletTreeVerifier,
  nowSeconds,
  parseWalletTreeAuthRequest,
  resolveOverviewOrNotFound,
  validateWalletTreeMessage,
  verifySignatureOutcome,
} from "./auth.js";

export type { HatChecker, IssueVerifier } from "./auth.js";

export type IssueHandlerDeps = {
  db: McpDb;
  env: Env;
  verifySignature?: IssueVerifier;
  /** Defaults to checking the Hats subgraph for operator/top hat. */
  checkHat?: HatChecker;
  fetchImpl?: typeof fetch;
};

/**
 * `POST /api/mcp-tokens` — issue a new `tbn2` token for `treeId`.
 *
 * Response on success carries the plaintext token exactly once — the
 * registry never stores it (see `schema.ts`).
 */
export async function handleIssueToken(
  request: Request,
  deps: IssueHandlerDeps,
): Promise<Response> {
  if (request.method !== "POST") {
    return errorResponse(405, "method_not_allowed");
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorResponse(400, "invalid_body", "Request body is not valid JSON");
  }
  const parsed = parseWalletTreeAuthRequest(raw, MCP_TOKEN_ISSUE_PRIMARY_TYPE);
  if (!parsed) {
    return errorResponse(
      400,
      "invalid_body",
      "Body does not match McpTokenIssueRequest",
    );
  }
  const { typedData, signature } = parsed;
  const { message: msg, domain } = typedData;

  // Own to this handler: `parseWalletTreeAuthRequest` only checks that
  // `label` is present and a string (envelope shape); the 1-100 character
  // business rule is issuance's own call.
  if (msg.label.length === 0 || msg.label.length > 100) {
    return errorResponse(
      400,
      "invalid_body",
      "message.label must be 1-100 chars",
    );
  }

  const now = nowSeconds();
  const shapeCheck = validateWalletTreeMessage(domain, msg, deps.env, now);
  if (!shapeCheck.ok) return shapeCheck.response;

  const verify =
    deps.verifySignature ??
    defaultWalletTreeVerifier<McpTokenIssueTypedData>(deps.env);
  const sigOutcome = await verifySignatureOutcome(
    verify,
    typedData,
    signature,
    msg.wallet,
  );
  if (!sigOutcome.ok) return sigOutcome.response;

  // Burn the nonce here: after the signature proves who is asking, but
  // before the subgraph read, the hat check, and `insertToken`.
  //
  // Both boundaries matter.
  //
  // *After* the signature, because this is the handler's first write and the
  // endpoint is public — the browser calls it directly. Burning any earlier
  // would let an unauthenticated stranger insert a row per request into
  // `used_mcp_auth_nonces` with a nonce of their choosing, which is
  // unbounded storage growth on a table nobody can prune.
  //
  // *Before* `insertToken`, because the PRIMARY KEY on `nonce` is what makes
  // replays mutually exclusive, and it can only do that if it is claimed
  // before the token exists. This handler used to burn *after* the insert,
  // with only a plain `isAuthNonceUsed` read up front: N concurrent replays
  // of one captured, validly-signed request all passed that read, each
  // minted its own distinct valid token, and the losers failed on the PK
  // afterwards — by which point the duplicate tokens already existed. Now
  // only the first request to reach this line gets past it.
  //
  // Trade-off: a request that burns its nonce here and then fails the hat
  // check or finds the workspace unindexed leaves that nonce permanently
  // spent with no token to show for it. That traps nobody, because the only
  // real caller (`$treeId_.settings.tsx`) signs a fresh `{expires, nonce}`
  // on every attempt — a retry is a new EIP-712 message, never a replay of
  // the failed one. Note this is the opposite order from
  // `@toban/identity`'s `connect.ts`, which persists before burning; it
  // optimises for a different failure mode (there, losing the binding is
  // worse than spending a nonce).
  try {
    await markAuthNonceUsed(deps.db, msg.nonce, now);
  } catch (err) {
    // Distinguish "another request already burned this nonce" (PRIMARY KEY
    // violation — the concurrent-replay case this reordering defends
    // against) from a genuine D1 failure, the same way
    // `@toban/identity`'s `connect.ts` does for its own nonce table: both
    // D1 and better-sqlite3 report a PK violation with a message containing
    // "UNIQUE constraint failed".
    const message = err instanceof Error ? err.message : String(err);
    if (/UNIQUE constraint failed/i.test(message)) {
      return errorResponse(400, "nonce_reused");
    }
    return errorResponse(
      500,
      "internal_error",
      `mark nonce failed: ${message}`,
    );
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const overviewOutcome = await resolveOverviewOrNotFound(
    deps.env,
    msg.treeId,
    fetchImpl,
  );
  if (!overviewOutcome.ok) return overviewOutcome.response;
  const hatCheck = await checkHatOrForbidden(
    msg.wallet,
    msg.treeId,
    overviewOutcome.overview,
    deps,
  );
  if (!hatCheck.ok) return hatCheck.response;

  if (!deps.env.MCP_TOKEN_SECRET) {
    return errorResponse(
      500,
      "internal_error",
      "MCP_TOKEN_SECRET is not configured",
    );
  }
  const tokenId = generateTokenId();
  const token = await issueToken(
    deps.env.MCP_TOKEN_SECRET,
    msg.treeId,
    tokenId,
  );
  await insertToken(deps.db, {
    tokenId,
    treeId: msg.treeId,
    label: msg.label,
    createdBy: msg.wallet,
    createdAt: now,
    revokedAt: null,
  });

  return json(200, {
    token,
    tokenId,
    treeId: msg.treeId,
    label: msg.label,
    createdAt: now,
  });
}
