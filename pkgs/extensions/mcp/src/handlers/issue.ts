/**
 * `POST /api/mcp-tokens` — self-service token issuance.
 *
 * Authorization is an EIP-712 wallet signature, not a Privy JWT — the same
 * boundary-contract pattern `@toban/identity` already uses for
 * `IdentityBinding` (`docs/mcp-extraction.md` §5). The Worker, not the
 * frontend, is the one that checks the wallet actually wears the
 * workspace's operator or top hat; the frontend's hat display is UI only.
 */
import { isAddress } from "viem";
import type { Address, Hex } from "viem";
import { generateTokenId, issueToken } from "../auth.js";
import { wearsAnyOfHats } from "../chain.js";
import {
  MCP_TOKEN_DOMAIN_NAME,
  MCP_TOKEN_DOMAIN_VERSION,
  MCP_TOKEN_ISSUE_PRIMARY_TYPE,
  type McpTokenIssueTypedData,
} from "../eip712/mcp-token.js";
import type { Env } from "../env.js";
import { resolveWorkspaceOverview } from "../queries.js";
import { type McpDb, insertToken, markAuthNonceUsed } from "../registry.js";
import { verifyMcpTokenAuthViaRpc } from "../verify.js";

export type IssueVerifier = (
  typedData: McpTokenIssueTypedData,
  signature: Hex,
  expectedAddress: Address,
) => Promise<boolean>;

export type HatChecker = (
  wallet: Address,
  treeId: string,
  fetchImpl: typeof fetch,
) => Promise<boolean>;

export type IssueHandlerDeps = {
  db: McpDb;
  env: Env;
  now?: () => number;
  verifySignature?: IssueVerifier;
  /** Defaults to checking the Hats subgraph for operator/top hat. */
  checkHat?: HatChecker;
  fetchImpl?: typeof fetch;
};

type IssueRequest = {
  typedData: McpTokenIssueTypedData;
  signature: Hex;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errorResponse(status: number, error: string, details?: string) {
  return json(status, details === undefined ? { error } : { error, details });
}

function parseRequest(raw: unknown): IssueRequest | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.signature !== "string" || !r.signature.startsWith("0x")) {
    return null;
  }
  if (typeof r.typedData !== "object" || r.typedData === null) return null;
  const td = r.typedData as Record<string, unknown>;
  if (
    typeof td.domain !== "object" ||
    td.domain === null ||
    typeof td.types !== "object" ||
    td.types === null ||
    typeof td.message !== "object" ||
    td.message === null ||
    td.primaryType !== MCP_TOKEN_ISSUE_PRIMARY_TYPE
  ) {
    return null;
  }
  const msg = td.message as Record<string, unknown>;
  if (
    typeof msg.wallet !== "string" ||
    typeof msg.treeId !== "string" ||
    typeof msg.label !== "string" ||
    (typeof msg.expires !== "string" &&
      typeof msg.expires !== "number" &&
      typeof msg.expires !== "bigint") ||
    typeof msg.nonce !== "string"
  ) {
    return null;
  }
  let expires: bigint;
  try {
    expires =
      typeof msg.expires === "bigint" ? msg.expires : BigInt(msg.expires);
  } catch {
    return null;
  }
  return {
    signature: r.signature as Hex,
    typedData: {
      domain: td.domain as McpTokenIssueTypedData["domain"],
      types: td.types as McpTokenIssueTypedData["types"],
      primaryType: MCP_TOKEN_ISSUE_PRIMARY_TYPE,
      message: {
        wallet: msg.wallet as Address,
        treeId: msg.treeId,
        label: msg.label,
        expires,
        nonce: msg.nonce as Hex,
      },
    },
  };
}

const defaultVerifier =
  (env: Env): IssueVerifier =>
  (typedData, signature, expected) =>
    verifyMcpTokenAuthViaRpc(typedData, signature, expected, env.RPC_URL);

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
  const parsed = parseRequest(raw);
  if (!parsed) {
    return errorResponse(
      400,
      "invalid_body",
      "Body does not match McpTokenIssueRequest",
    );
  }
  const { typedData, signature } = parsed;
  const { message: msg, domain } = typedData;

  if (
    domain.name !== MCP_TOKEN_DOMAIN_NAME ||
    domain.version !== MCP_TOKEN_DOMAIN_VERSION ||
    typeof domain.chainId !== "number" ||
    domain.chainId !== Number(deps.env.CHAIN_ID)
  ) {
    return errorResponse(400, "domain_mismatch");
  }
  if (!isAddress(msg.wallet)) {
    return errorResponse(
      400,
      "invalid_body",
      "message.wallet is not an address",
    );
  }
  if (!/^\d+$/.test(msg.treeId)) {
    return errorResponse(400, "invalid_body", "message.treeId must be numeric");
  }
  if (msg.label.length === 0 || msg.label.length > 100) {
    return errorResponse(
      400,
      "invalid_body",
      "message.label must be 1-100 chars",
    );
  }

  const now = (deps.now ?? (() => Math.floor(Date.now() / 1000)))();
  if (msg.expires <= BigInt(now)) {
    return errorResponse(400, "expired", "message.expires is in the past");
  }

  const verify = deps.verifySignature ?? defaultVerifier(deps.env);
  let signatureValid: boolean;
  try {
    signatureValid = await verify(typedData, signature, msg.wallet);
  } catch (err) {
    return errorResponse(
      400,
      "wallet_mismatch",
      err instanceof Error ? err.message : "signature verification threw",
    );
  }
  if (!signatureValid) {
    return errorResponse(400, "wallet_mismatch");
  }

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
  const overview = await resolveWorkspaceOverview(
    deps.env,
    msg.treeId,
    fetchImpl,
  );
  if (!overview) {
    return errorResponse(
      404,
      "workspace_not_found",
      "treeId is not indexed yet",
    );
  }
  const checkHat =
    deps.checkHat ??
    ((wallet: Address, treeId: string, fi: typeof fetch) =>
      wearsAnyOfHats(
        deps.env,
        wallet,
        treeId,
        [overview.hats.operatorHatId, overview.hats.topHatId],
        fi,
      ));
  const authorized = await checkHat(msg.wallet, msg.treeId, fetchImpl);
  if (!authorized) {
    return errorResponse(
      403,
      "unauthorized_wallet",
      "wallet does not wear the workspace's operator or top hat",
    );
  }

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
