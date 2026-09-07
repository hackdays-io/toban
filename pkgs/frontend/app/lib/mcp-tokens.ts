/**
 * Pure helpers for the MCP-token "list" flow used by
 * `$treeId_.settings.tsx`'s `McpTokenSection`.
 *
 * Extracted out of the route file for two reasons:
 *   1. React Router's `flatRoutes()` turns any `app/routes/*.test.ts` file
 *      into a route, so the wire contract this module owns — POST
 *      `/api/mcp-tokens/list` with a signed `McpTokenListRequest` — can only
 *      get a unit test if it lives outside `app/routes/`.
 *   2. This is exactly the contract review finding #1 was about: the
 *      settings page used to call `GET /api/mcp-tokens`, which the
 *      `@toban/mcp` Worker never implemented (`pkgs/extensions/mcp/src/handlers/list.ts`
 *      only ever served `POST /api/mcp-tokens/list`). Having it as a plain,
 *      testable function makes that mismatch something a test catches
 *      instead of something only discovered by clicking around the page.
 *
 * **Deliberately does not sign anything.** Building the EIP-712 message and
 * asking the wallet to sign it stays in the route file, gated behind an
 * explicit user action ("show the list") — see the module doc on
 * `McpTokenSection` for why listing must never trigger a signature on page
 * load.
 */
import {
  MCP_TOKEN_DOMAIN_NAME,
  MCP_TOKEN_DOMAIN_VERSION,
  MCP_TOKEN_LIST_PRIMARY_TYPE,
  MCP_TOKEN_LIST_TYPES,
} from "@toban/mcp/eip712";
import type { Address, Hex } from "viem";

export type McpTokenListTypedData = {
  domain: {
    name: typeof MCP_TOKEN_DOMAIN_NAME;
    version: typeof MCP_TOKEN_DOMAIN_VERSION;
    chainId: number;
  };
  types: typeof MCP_TOKEN_LIST_TYPES;
  primaryType: typeof MCP_TOKEN_LIST_PRIMARY_TYPE;
  message: {
    wallet: Address;
    treeId: string;
    expires: bigint;
    nonce: Hex;
  };
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
    domain: {
      name: MCP_TOKEN_DOMAIN_NAME,
      version: MCP_TOKEN_DOMAIN_VERSION,
      chainId: opts.chainId,
    },
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
          // issue/revoke's own serialisation in the route file.
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
