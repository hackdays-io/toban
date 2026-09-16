/**
 * Pure helpers for the MCP-token issue/list/revoke flows used by
 * `$treeId_.settings.tsx`'s `McpTokenSection`.
 *
 * Extracted out of the route file for two reasons:
 *   1. React Router's `flatRoutes()` turns any `app/routes/*.test.ts` file
 *      into a route, so the wire contracts this module owns — POST
 *      `/api/mcp-tokens`, `/api/mcp-tokens/list`, and `/api/mcp-tokens/revoke`
 *      with their respective signed EIP-712 requests — can only get a unit
 *      test if they live outside `app/routes/`.
 *   2. This is exactly the contract review finding #1 was about: the
 *      settings page used to call `GET /api/mcp-tokens`, which the
 *      `@toban/mcp` Worker never implemented (`pkgs/extensions/mcp/src/handlers/list.ts`
 *      only ever served `POST /api/mcp-tokens/list`). Having it as a plain,
 *      testable function makes that mismatch something a test catches
 *      instead of something only discovered by clicking around the page.
 *      Issue and revoke carry the same risk — a request-shape typo there is
 *      just as untestable inside the route file — so they get the same
 *      treatment rather than staying hand-rolled.
 *
 * **Deliberately does not sign anything.** Building each EIP-712 message and
 * asking the wallet to sign it stays in the route file, gated behind an
 * explicit user action, so the wallet-popup timing (e.g. listing must never
 * sign on page load — see the module doc on `McpTokenSection`) stays a
 * route-file concern. `buildMcpToken*TypedData` below only shapes the
 * message; `postMcpToken*` below only sends an already-signed one.
 */
import {
  MCP_TOKEN_ISSUE_PRIMARY_TYPE,
  MCP_TOKEN_ISSUE_TYPES,
  MCP_TOKEN_LIST_PRIMARY_TYPE,
  MCP_TOKEN_LIST_TYPES,
  MCP_TOKEN_REVOKE_PRIMARY_TYPE,
  MCP_TOKEN_REVOKE_TYPES,
  buildMcpTokenDomain,
} from "@toban/mcp/eip712";
import type { Address, Hex } from "viem";

export type McpTokenListTypedData = {
  domain: ReturnType<typeof buildMcpTokenDomain>;
  types: typeof MCP_TOKEN_LIST_TYPES;
  primaryType: typeof MCP_TOKEN_LIST_PRIMARY_TYPE;
  message: {
    wallet: Address;
    treeId: string;
    expires: bigint;
    nonce: Hex;
  };
};

export type McpTokenIssueTypedData = {
  domain: ReturnType<typeof buildMcpTokenDomain>;
  types: typeof MCP_TOKEN_ISSUE_TYPES;
  primaryType: typeof MCP_TOKEN_ISSUE_PRIMARY_TYPE;
  message: {
    wallet: Address;
    treeId: string;
    label: string;
    expires: bigint;
    nonce: Hex;
  };
};

// `tokenId` sits inside the signed message, not a bare request-body field —
// see `@toban/mcp/eip712`'s module doc for why a revoke signature must
// commit to *which* token it authorises revoking (a listing signature and a
// revoke signature used to be byte-identical typed data, so any list
// signature could be replayed as a revoke of an attacker-chosen tokenId).
export type McpTokenRevokeTypedData = {
  domain: ReturnType<typeof buildMcpTokenDomain>;
  types: typeof MCP_TOKEN_REVOKE_TYPES;
  primaryType: typeof MCP_TOKEN_REVOKE_PRIMARY_TYPE;
  message: {
    wallet: Address;
    treeId: string;
    tokenId: string;
    expires: bigint;
    nonce: Hex;
  };
};

/** A freshly issued token, shown to the admin exactly once — see
 *  `postMcpTokenIssue`. */
export type IssuedMcpToken = {
  token: string;
  tokenId: string;
  treeId: string;
  label: string;
  createdAt: number;
};

/** A signed `McpTokenListRequest`, held in the settings page's component
 *  state and reused for the rest of the session — see `isListAuthUsable`. */
export type McpTokenListAuth = {
  typedData: McpTokenListTypedData;
  signature: Hex;
};

export type McpTokenListItem = {
  tokenId: string;
  treeId: string;
  label: string;
  createdBy: Address;
  createdAt: number;
  revokedAt: number | null;
};

/** Build the `McpTokenListRequest` typed data the settings page hands to the
 *  wallet for signing. Pure — takes `nowSeconds` explicitly so it is
 *  deterministic under test. */
export function buildMcpTokenListTypedData(opts: {
  wallet: Address;
  treeId: string;
  chainId: number;
  nonce: Hex;
  ttlSeconds: number;
  nowSeconds?: number;
}): McpTokenListTypedData {
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  return {
    domain: buildMcpTokenDomain(opts.chainId),
    types: MCP_TOKEN_LIST_TYPES,
    primaryType: MCP_TOKEN_LIST_PRIMARY_TYPE,
    message: {
      wallet: opts.wallet,
      treeId: opts.treeId,
      expires: BigInt(now + opts.ttlSeconds),
      nonce: opts.nonce,
    },
  };
}

/** Build the `McpTokenIssueRequest` typed data the settings page hands to
 *  the wallet for signing. Pure, mirrors `buildMcpTokenListTypedData`. */
export function buildMcpTokenIssueTypedData(opts: {
  wallet: Address;
  treeId: string;
  label: string;
  chainId: number;
  nonce: Hex;
  ttlSeconds: number;
  nowSeconds?: number;
}): McpTokenIssueTypedData {
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  return {
    domain: buildMcpTokenDomain(opts.chainId),
    types: MCP_TOKEN_ISSUE_TYPES,
    primaryType: MCP_TOKEN_ISSUE_PRIMARY_TYPE,
    message: {
      wallet: opts.wallet,
      treeId: opts.treeId,
      label: opts.label,
      expires: BigInt(now + opts.ttlSeconds),
      nonce: opts.nonce,
    },
  };
}

/** Build the `McpTokenRevokeRequest` typed data the settings page hands to
 *  the wallet for signing. Pure, mirrors `buildMcpTokenListTypedData`. */
export function buildMcpTokenRevokeTypedData(opts: {
  wallet: Address;
  treeId: string;
  tokenId: string;
  chainId: number;
  nonce: Hex;
  ttlSeconds: number;
  nowSeconds?: number;
}): McpTokenRevokeTypedData {
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  return {
    domain: buildMcpTokenDomain(opts.chainId),
    types: MCP_TOKEN_REVOKE_TYPES,
    primaryType: MCP_TOKEN_REVOKE_PRIMARY_TYPE,
    message: {
      wallet: opts.wallet,
      treeId: opts.treeId,
      tokenId: opts.tokenId,
      expires: BigInt(now + opts.ttlSeconds),
      nonce: opts.nonce,
    },
  };
}

/**
 * True when `auth`'s signed `expires` is far enough in the future to still
 * be worth sending — used both to gate the "show list" UI (skip the reveal
 * button once a usable signature already exists) and to decide, right after
 * a successful issue, whether the existing signature can be reused or a
 * fresh one is needed. `skewSeconds` leaves a margin so a request in flight
 * doesn't land at the Worker a few seconds after this check passed but after
 * `expires` — the Worker's own clock, not this one, is authoritative.
 */
export function isListAuthUsable(
  auth: McpTokenListAuth | null,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  skewSeconds = 30,
): auth is McpTokenListAuth {
  if (!auth) return false;
  return auth.typedData.message.expires > BigInt(nowSeconds + skewSeconds);
}

/**
 * `POST /api/mcp-tokens/list` — the endpoint that actually exists
 * (`pkgs/extensions/mcp/src/handlers/list.ts`), unlike the `GET
 * /api/mcp-tokens?treeId=...` this replaced.
 */
export async function fetchMcpTokenList(
  mcpWorkerUrl: string,
  auth: McpTokenListAuth,
  fetchImpl: typeof fetch = fetch,
): Promise<McpTokenListItem[]> {
  const res = await fetchImpl(
    `${mcpWorkerUrl.replace(/\/$/, "")}/api/mcp-tokens/list`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typedData: {
          ...auth.typedData,
          // uint256 as decimal string — JSON can't carry bigint; mirrors
          // `postMcpTokenIssue` / `postMcpTokenRevoke` below.
          message: {
            ...auth.typedData.message,
            expires: auth.typedData.message.expires.toString(),
          },
        },
        signature: auth.signature,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`一覧の取得に失敗しました (${res.status})`);
  }
  const body = (await res.json()) as { tokens: McpTokenListItem[] };
  return body.tokens;
}

/**
 * `POST /api/mcp-tokens` — issue a new token. Returns the plaintext token,
 * which the Worker never stores and never shows again (see `IssuedMcpToken`)
 * — the caller is responsible for surfacing it to the admin exactly once.
 */
export async function postMcpTokenIssue(
  mcpWorkerUrl: string,
  typedData: McpTokenIssueTypedData,
  signature: Hex,
  fetchImpl: typeof fetch = fetch,
): Promise<IssuedMcpToken> {
  const res = await fetchImpl(
    `${mcpWorkerUrl.replace(/\/$/, "")}/api/mcp-tokens`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typedData: {
          ...typedData,
          message: {
            ...typedData.message,
            expires: typedData.message.expires.toString(),
          },
        },
        signature,
      }),
    },
  );
  if (!res.ok) {
    // The Worker's own validation message (Hats-wearer check, expired
    // signature, ...) is more useful to the admin than a bare status code,
    // so surface it when present.
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      body.error
        ? `発行に失敗しました: ${body.error}`
        : `発行に失敗しました (${res.status})`,
    );
  }
  return (await res.json()) as IssuedMcpToken;
}

/**
 * `POST /api/mcp-tokens/revoke`. No response body to speak of — revoking is
 * idempotent from the caller's point of view, so success is just "no
 * throw"; the caller re-fetches the list to see the updated `revokedAt`.
 */
export async function postMcpTokenRevoke(
  mcpWorkerUrl: string,
  typedData: McpTokenRevokeTypedData,
  signature: Hex,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const res = await fetchImpl(
    `${mcpWorkerUrl.replace(/\/$/, "")}/api/mcp-tokens/revoke`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typedData: {
          ...typedData,
          message: {
            ...typedData.message,
            expires: typedData.message.expires.toString(),
          },
        },
        signature,
      }),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      body.error
        ? `失効に失敗しました: ${body.error}`
        : `失効に失敗しました (${res.status})`,
    );
  }
}
