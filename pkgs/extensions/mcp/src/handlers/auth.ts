/**
 * Shared "wallet speaks for treeId" auth for the three token-management
 * handlers: `POST /api/mcp-tokens` (issue), `/list`, and `/revoke`. All
 * three authorise the same way — parse an EIP-712 envelope, check its
 * domain / wallet / treeId / expiry, verify the signature, resolve the
 * workspace overview, and check the wallet wears the operator or top hat —
 * differing only in which `primaryType` they expect and what they do once
 * authorised.
 *
 * This used to live in `handlers/list.ts` (revoke.ts imported it from
 * there); issuance re-implemented the same ~100 lines by hand instead of
 * joining in. This module is the neutral home now that all three use it.
 *
 * Not to be confused with `../auth.ts`, which verifies the `tbn2` *bearer*
 * token on `POST /mcp` — a completely different credential (a stateless
 * HMAC over `{treeId, tokenId}`, not an EIP-712 wallet signature).
 */
import { isAddress } from "viem";
import type { Address, Hex } from "viem";
import { wearsAnyOfHats } from "../chain.js";
import {
  MCP_TOKEN_DOMAIN_NAME,
  MCP_TOKEN_DOMAIN_VERSION,
  MCP_TOKEN_ISSUE_PRIMARY_TYPE,
  MCP_TOKEN_LIST_PRIMARY_TYPE,
  MCP_TOKEN_REVOKE_PRIMARY_TYPE,
  type McpTokenDomain,
  type McpTokenIssueMessage,
  type McpTokenIssueTypedData,
  type McpTokenListMessage,
  type McpTokenListTypedData,
  type McpTokenRevokeMessage,
  type McpTokenRevokeTypedData,
} from "../eip712/mcp-token.js";
import type { Env } from "../env.js";
import { errorResponse } from "../http.js";
import {
  type WorkspaceOverview,
  resolveWorkspaceOverview,
} from "../queries.js";
import { verifyMcpTokenAuthViaRpc } from "../verify.js";

/** Any of the three "wallet speaks for treeId" typed-data shapes. */
export type WalletTreeTypedData =
  | McpTokenIssueTypedData
  | McpTokenListTypedData
  | McpTokenRevokeTypedData;

export type IssueVerifier = (
  typedData: McpTokenIssueTypedData,
  signature: Hex,
  expectedAddress: Address,
) => Promise<boolean>;

export type ListVerifier = (
  typedData: McpTokenListTypedData,
  signature: Hex,
  expectedAddress: Address,
) => Promise<boolean>;

export type RevokeVerifier = (
  typedData: McpTokenRevokeTypedData,
  signature: Hex,
  expectedAddress: Address,
) => Promise<boolean>;

export type HatChecker = (
  wallet: Address,
  treeId: string,
  fetchImpl: typeof fetch,
) => Promise<boolean>;

export type WalletTreeAuthRequest<T extends WalletTreeTypedData> = {
  typedData: T;
  signature: Hex;
};

/**
 * Parse the common envelope shape and **reject any envelope whose
 * `primaryType` is not `expectedPrimaryType`** — see `eip712/mcp-token.ts`'s
 * module doc for the vulnerability that check closes (a signature captured
 * for one operation being replayed, with a different body shape bolted on,
 * against another). Overloaded on the three primary types so each caller
 * gets back the concrete typed-data shape it expects.
 *
 * Issuance's extra `label` field is checked here only for *presence and
 * type* (part of the envelope shape); its 1-100-character business rule
 * stays in `issue.ts`, which owns that validation.
 */
export function parseWalletTreeAuthRequest(
  raw: unknown,
  expectedPrimaryType: typeof MCP_TOKEN_ISSUE_PRIMARY_TYPE,
): WalletTreeAuthRequest<McpTokenIssueTypedData> | null;
export function parseWalletTreeAuthRequest(
  raw: unknown,
  expectedPrimaryType: typeof MCP_TOKEN_LIST_PRIMARY_TYPE,
): WalletTreeAuthRequest<McpTokenListTypedData> | null;
export function parseWalletTreeAuthRequest(
  raw: unknown,
  expectedPrimaryType: typeof MCP_TOKEN_REVOKE_PRIMARY_TYPE,
): WalletTreeAuthRequest<McpTokenRevokeTypedData> | null;
export function parseWalletTreeAuthRequest(
  raw: unknown,
  expectedPrimaryType:
    | typeof MCP_TOKEN_ISSUE_PRIMARY_TYPE
    | typeof MCP_TOKEN_LIST_PRIMARY_TYPE
    | typeof MCP_TOKEN_REVOKE_PRIMARY_TYPE,
): WalletTreeAuthRequest<WalletTreeTypedData> | null {
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
    td.primaryType !== expectedPrimaryType
  ) {
    return null;
  }
  const msg = td.message as Record<string, unknown>;
  if (
    typeof msg.wallet !== "string" ||
    typeof msg.treeId !== "string" ||
    (typeof msg.expires !== "string" &&
      typeof msg.expires !== "number" &&
      typeof msg.expires !== "bigint") ||
    typeof msg.nonce !== "string"
  ) {
    return null;
  }
  if (
    expectedPrimaryType === MCP_TOKEN_ISSUE_PRIMARY_TYPE &&
    typeof msg.label !== "string"
  ) {
    return null;
  }
  if (
    expectedPrimaryType === MCP_TOKEN_REVOKE_PRIMARY_TYPE &&
    (typeof msg.tokenId !== "string" || msg.tokenId.length === 0)
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
  const base = {
    wallet: msg.wallet as Address,
    treeId: msg.treeId,
    expires,
    nonce: msg.nonce as Hex,
  };
  const signature = r.signature as Hex;
  const domain = td.domain as McpTokenDomain;

  if (expectedPrimaryType === MCP_TOKEN_ISSUE_PRIMARY_TYPE) {
    const message: McpTokenIssueMessage = {
      ...base,
      label: msg.label as string,
    };
    return {
      signature,
      typedData: {
        domain,
        types: td.types as McpTokenIssueTypedData["types"],
        primaryType: MCP_TOKEN_ISSUE_PRIMARY_TYPE,
        message,
      },
    };
  }
  if (expectedPrimaryType === MCP_TOKEN_LIST_PRIMARY_TYPE) {
    const message: McpTokenListMessage = base;
    return {
      signature,
      typedData: {
        domain,
        types: td.types as McpTokenListTypedData["types"],
        primaryType: MCP_TOKEN_LIST_PRIMARY_TYPE,
        message,
      },
    };
  }
  const message: McpTokenRevokeMessage = {
    ...base,
    tokenId: msg.tokenId as string,
  };
  return {
    signature,
    typedData: {
      domain,
      types: td.types as McpTokenRevokeTypedData["types"],
      primaryType: MCP_TOKEN_REVOKE_PRIMARY_TYPE,
      message,
    },
  };
}

/** `{wallet, treeId, expires, nonce}` — the fields every one of the three
 *  message shapes carries, ignoring whichever extra field distinguishes it. */
type CommonMessage = {
  wallet: Address;
  treeId: string;
  expires: bigint;
  nonce: Hex;
};

type Outcome = { ok: true } | { ok: false; response: Response };

/**
 * Shape/expiry validation shared by all three handlers — pure, no I/O.
 * Domain mismatch, a non-address wallet, a non-numeric treeId, or an
 * already-past `expires` are rejected identically regardless of which
 * operation is being authorised.
 */
export function validateWalletTreeMessage(
  domain: McpTokenDomain,
  msg: CommonMessage,
  env: Env,
  now: number,
): Outcome {
  if (
    domain.name !== MCP_TOKEN_DOMAIN_NAME ||
    domain.version !== MCP_TOKEN_DOMAIN_VERSION ||
    typeof domain.chainId !== "number" ||
    domain.chainId !== Number(env.CHAIN_ID)
  ) {
    return { ok: false, response: errorResponse(400, "domain_mismatch") };
  }
  if (!isAddress(msg.wallet)) {
    return {
      ok: false,
      response: errorResponse(
        400,
        "invalid_body",
        "message.wallet is not an address",
      ),
    };
  }
  if (!/^\d+$/.test(msg.treeId)) {
    return {
      ok: false,
      response: errorResponse(
        400,
        "invalid_body",
        "message.treeId must be numeric",
      ),
    };
  }
  if (msg.expires <= BigInt(now)) {
    return { ok: false, response: errorResponse(400, "expired") };
  }
  return { ok: true };
}

/** Wall-clock seconds. Not an injectable seam: nothing in this package's
 *  test suite has ever overridden it (checked as part of the "quality
 *  cleanups" pass), so threading a `now?: () => number` deps field through
 *  three handlers was pure indirection for a value nobody controls. */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Call `verify` and translate its outcome — including a thrown error — into
 * the handlers' `wallet_mismatch` response shape. Split out so the
 * concurrent path in `verifyWalletTreeAuth` can run it alongside the
 * workspace lookup instead of after it.
 */
export async function verifySignatureOutcome<T extends WalletTreeTypedData>(
  verify: (typedData: T, signature: Hex, expected: Address) => Promise<boolean>,
  typedData: T,
  signature: Hex,
  wallet: Address,
): Promise<Outcome> {
  let valid: boolean;
  try {
    valid = await verify(typedData, signature, wallet);
  } catch (err) {
    return {
      ok: false,
      response: errorResponse(
        400,
        "wallet_mismatch",
        err instanceof Error ? err.message : "signature verification threw",
      ),
    };
  }
  if (!valid) {
    return { ok: false, response: errorResponse(400, "wallet_mismatch") };
  }
  return { ok: true };
}

/** Resolve the workspace overview or fail with `workspace_not_found`. */
export async function resolveOverviewOrNotFound(
  env: Env,
  treeId: string,
  fetchImpl: typeof fetch,
): Promise<
  { ok: true; overview: WorkspaceOverview } | { ok: false; response: Response }
> {
  const overview = await resolveWorkspaceOverview(env, treeId, fetchImpl);
  if (!overview) {
    return { ok: false, response: errorResponse(404, "workspace_not_found") };
  }
  return { ok: true, overview };
}

/** Check the wallet wears the workspace's operator or top hat, or fail with
 *  `unauthorized_wallet`. Defaults to the Hats subgraph; overridable in tests. */
export async function checkHatOrForbidden(
  wallet: Address,
  treeId: string,
  overview: WorkspaceOverview,
  deps: { env: Env; checkHat?: HatChecker; fetchImpl?: typeof fetch },
): Promise<Outcome> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const checkHat =
    deps.checkHat ??
    ((w: Address, t: string, fi: typeof fetch) =>
      wearsAnyOfHats(
        deps.env,
        w,
        t,
        [overview.hats.operatorHatId, overview.hats.topHatId],
        fi,
      ));
  const authorized = await checkHat(wallet, treeId, fetchImpl);
  if (!authorized) {
    return { ok: false, response: errorResponse(403, "unauthorized_wallet") };
  }
  return { ok: true };
}

/** Default verifier for any of the three typed-data shapes: recover via RPC
 *  against the Worker's own `CHAIN_ID`. */
export function defaultWalletTreeVerifier<T extends WalletTreeTypedData>(
  env: Env,
): (
  typedData: T,
  signature: Hex,
  expectedAddress: Address,
) => Promise<boolean> {
  return (typedData, signature, expected) =>
    verifyMcpTokenAuthViaRpc(typedData, signature, expected, env.RPC_URL);
}

/**
 * Full auth flow for **list and revoke**: shape/expiry check, then signature
 * verification and the workspace-overview lookup **concurrently** — the
 * lookup only needs `msg.treeId`, known straight from the request body, and
 * the data it fetches is subgraph-public, so there is nothing to protect by
 * waiting for the signature to check out first. This does mean the
 * workspace lookup now runs for a request whose signature turns out
 * invalid; that is acceptable (public data, no write) — do not "fix" this
 * back to sequential. `checkHat` runs last because it genuinely depends on
 * `overview.hats`, which only exists once the lookup above resolves.
 *
 * **Issuance does not use this function.** Its nonce burn must land after
 * signature verification but before the workspace-overview read (see
 * `issue.ts`'s comment at the `markAuthNonceUsed` call), which rules out
 * fetching the overview concurrently with the signature check. `issue.ts`
 * instead calls `validateWalletTreeMessage` / `verifySignatureOutcome` /
 * `resolveOverviewOrNotFound` / `checkHatOrForbidden` directly, in that
 * order, with the nonce burn spliced between the second and third.
 */
export async function verifyWalletTreeAuth<T extends WalletTreeTypedData>(
  parsed: WalletTreeAuthRequest<T>,
  deps: {
    env: Env;
    verifySignature?: (
      typedData: T,
      signature: Hex,
      expectedAddress: Address,
    ) => Promise<boolean>;
    checkHat?: HatChecker;
    fetchImpl?: typeof fetch;
  },
): Promise<
  | { ok: true; wallet: Address; treeId: string; now: number }
  | { ok: false; response: Response }
> {
  const { typedData, signature } = parsed;
  const { message: msg, domain } = typedData;
  const now = nowSeconds();

  const shapeCheck = validateWalletTreeMessage(domain, msg, deps.env, now);
  if (!shapeCheck.ok) return shapeCheck;

  const verify = deps.verifySignature ?? defaultWalletTreeVerifier<T>(deps.env);
  const fetchImpl = deps.fetchImpl ?? fetch;
  const [sigOutcome, overviewOutcome] = await Promise.all([
    verifySignatureOutcome(verify, typedData, signature, msg.wallet),
    resolveOverviewOrNotFound(deps.env, msg.treeId, fetchImpl),
  ]);
  if (!sigOutcome.ok) return sigOutcome;
  if (!overviewOutcome.ok) return overviewOutcome;

  const hatCheck = await checkHatOrForbidden(
    msg.wallet,
    msg.treeId,
    overviewOutcome.overview,
    deps,
  );
  if (!hatCheck.ok) return hatCheck;

  return { ok: true, wallet: msg.wallet, treeId: msg.treeId, now };
}
