/** viem-compatible address / bytes hex brands — kept local so SSR consumers
 *  (frontend) don't pull viem in through this boundary-contract module.
 *  Mirrors `@toban/identity/eip712`'s identity-binding.ts exactly. */
type Address = `0x${string}`;
type Hex = `0x${string}`;

/**
 * EIP-712 boundary contracts for `@toban/mcp` token issuance and management.
 *
 * This shape is the wire contract shared with the frontend's
 * `/$treeId/settings` MCP-token section (`docs/mcp-extraction.md` §5). Do not
 * reorder fields, rename them, or alter their `type` strings without
 * coordinating across all consumers — the typed-data hash depends on field
 * order, exactly like `@toban/identity`'s `IdentityBinding`.
 *
 * Three message shapes, not two:
 *
 * - `McpTokenIssueRequest` — "mint a new token for treeId, labelled `label`".
 *   Single-use (`nonce` is burned on success) because issuing is a write.
 * - `McpTokenListRequest` — "I am `wallet`, and I speak for `treeId`; show me
 *   its tokens". Read-only, so its `nonce` is never burned (see
 *   `handlers/list.ts` for why that is still safe).
 * - `McpTokenRevokeRequest` — "I am `wallet`, I speak for `treeId`, and I am
 *   revoking `tokenId`". A write, so its `nonce` is burned like issuance.
 *
 * `McpTokenListRequest` and `McpTokenRevokeRequest` used to be one shared
 * type, `McpTokenManageRequest { wallet, treeId, expires, nonce }`, used to
 * authorise *both* listing and revocation. That was a real vulnerability: a
 * listing signature and a revoke signature were byte-identical typed data,
 * and listing never burns its nonce (by design — see above), so any
 * signature an admin produced to list their tokens could be replayed against
 * the revoke endpoint with an attacker-chosen `tokenId` — read the request
 * body for it, since it wasn't part of the signed message either — any time
 * before `expires`. Capturing a list signature needs no MITM: a browser
 * extension, a request log, or a devtools screenshot is enough.
 *
 * The fix is these two distinct `primaryType`s. EIP-712's struct hash is
 * salted by `primaryType`, so a `McpTokenListRequest` signature and a
 * `McpTokenRevokeRequest` signature over the same `{wallet, treeId, expires,
 * nonce}` values hash to different digests — one is simply not a valid
 * signature for the other's message, and no amount of nonce/replay handling
 * can substitute for that. `tokenId` is also now inside the revoke struct
 * (see field order below — it comes right after `treeId`), not a bare
 * request-body field, so the target of a revoke is authenticated too. Do
 * not reunify these two types; that reintroduces the exact bug this comment
 * describes.
 */
export const MCP_TOKEN_ISSUE_PRIMARY_TYPE = "McpTokenIssueRequest" as const;
export const MCP_TOKEN_LIST_PRIMARY_TYPE = "McpTokenListRequest" as const;
export const MCP_TOKEN_REVOKE_PRIMARY_TYPE = "McpTokenRevokeRequest" as const;

export const MCP_TOKEN_ISSUE_TYPES = {
  McpTokenIssueRequest: [
    { name: "wallet", type: "address" },
    { name: "treeId", type: "string" },
    { name: "label", type: "string" },
    { name: "expires", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export const MCP_TOKEN_LIST_TYPES = {
  McpTokenListRequest: [
    { name: "wallet", type: "address" },
    { name: "treeId", type: "string" },
    { name: "expires", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export const MCP_TOKEN_REVOKE_TYPES = {
  McpTokenRevokeRequest: [
    { name: "wallet", type: "address" },
    { name: "treeId", type: "string" },
    { name: "tokenId", type: "string" },
    { name: "expires", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export const MCP_TOKEN_DOMAIN_NAME = "TobanMcp" as const;
export const MCP_TOKEN_DOMAIN_VERSION = "1" as const;

export type McpTokenDomain = {
  name: typeof MCP_TOKEN_DOMAIN_NAME;
  version: typeof MCP_TOKEN_DOMAIN_VERSION;
  chainId: number;
  // No `verifyingContract`: this is an off-chain attestation, same reasoning
  // as IdentityBinding.
};

export type McpTokenIssueMessage = {
  wallet: Address;
  treeId: string;
  label: string;
  expires: bigint;
  nonce: Hex;
};

export type McpTokenListMessage = {
  wallet: Address;
  treeId: string;
  expires: bigint;
  nonce: Hex;
};

export type McpTokenRevokeMessage = {
  wallet: Address;
  treeId: string;
  tokenId: string;
  expires: bigint;
  nonce: Hex;
};

export type McpTokenIssueTypedData = {
  domain: McpTokenDomain;
  types: typeof MCP_TOKEN_ISSUE_TYPES;
  primaryType: typeof MCP_TOKEN_ISSUE_PRIMARY_TYPE;
  message: McpTokenIssueMessage;
};

export type McpTokenListTypedData = {
  domain: McpTokenDomain;
  types: typeof MCP_TOKEN_LIST_TYPES;
  primaryType: typeof MCP_TOKEN_LIST_PRIMARY_TYPE;
  message: McpTokenListMessage;
};

export type McpTokenRevokeTypedData = {
  domain: McpTokenDomain;
  types: typeof MCP_TOKEN_REVOKE_TYPES;
  primaryType: typeof MCP_TOKEN_REVOKE_PRIMARY_TYPE;
  message: McpTokenRevokeMessage;
};

/**
 * Build the EIP-712 domain for a given network. `verifyingContract` is
 * intentionally omitted, matching `buildIdentityBindingDomain`.
 */
export function buildMcpTokenDomain(chainId: number): McpTokenDomain {
  return {
    name: MCP_TOKEN_DOMAIN_NAME,
    version: MCP_TOKEN_DOMAIN_VERSION,
    chainId,
  };
}
