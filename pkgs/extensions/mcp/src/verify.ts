import { http, createPublicClient, defineChain } from "viem";
import type { Address, Chain, Hex } from "viem";
import { sepolia } from "viem/chains";
import {
  MCP_TOKEN_ISSUE_PRIMARY_TYPE,
  MCP_TOKEN_ISSUE_TYPES,
  MCP_TOKEN_LIST_PRIMARY_TYPE,
  MCP_TOKEN_LIST_TYPES,
  MCP_TOKEN_REVOKE_TYPES,
  type McpTokenIssueTypedData,
  type McpTokenListTypedData,
  type McpTokenRevokeTypedData,
  buildMcpTokenDomain,
} from "./eip712/mcp-token.js";

/**
 * Verify an EIP-712 signature for any of `@toban/mcp`'s boundary
 * contracts, accommodating EOA, EIP-1271 smart-account, and ERC-6492
 * signatures uniformly — identical reasoning to
 * `@toban/identity`'s `verifyIdentityBindingViaRpc` (Privy embedded wallets
 * need this, not just plain EOAs).
 *
 * Generic over the three typed-data shapes so issuance, listing, and
 * revocation share one verification path instead of near-identical copies.
 * The branch on `primaryType` is a discriminant, not a behavioural
 * difference — it exists only so TypeScript can narrow `typedData` to the
 * shape that actually matches its own `types`, without a
 * `message: ... as any` escape hatch.
 *
 * **`types` and `domain` are never taken from the caller's `typedData`** —
 * only `message` and `domain.chainId` are. `types` comes from the
 * `MCP_TOKEN_*_TYPES` constant matching `primaryType`, and `domain` is
 * rebuilt via `buildMcpTokenDomain(chainId)`. A request that supplied a
 * different `types` shape or extra `domain` keys was never actually
 * exploitable this way — either one changes the EIP-712 struct hash, so a
 * signature captured for the real shape can't be replayed as valid for a
 * forged one — but there is no reason to make every future reader of this
 * function re-derive that argument. Pinning the inputs we control removes
 * the question entirely.
 */
export async function verifyMcpTokenAuthViaRpc(
  typedData:
    | McpTokenIssueTypedData
    | McpTokenListTypedData
    | McpTokenRevokeTypedData,
  signature: Hex,
  expectedAddress: Address,
  rpcUrl: string,
): Promise<boolean> {
  const chain = resolveChain(typedData.domain.chainId, rpcUrl);
  const client = createPublicClient({ chain, transport: http(rpcUrl) });
  const domain = buildMcpTokenDomain(typedData.domain.chainId);
  if (typedData.primaryType === MCP_TOKEN_ISSUE_PRIMARY_TYPE) {
    return await client.verifyTypedData({
      address: expectedAddress,
      domain,
      types: MCP_TOKEN_ISSUE_TYPES,
      primaryType: typedData.primaryType,
      message: typedData.message,
      signature,
    });
  }
  if (typedData.primaryType === MCP_TOKEN_LIST_PRIMARY_TYPE) {
    return await client.verifyTypedData({
      address: expectedAddress,
      domain,
      types: MCP_TOKEN_LIST_TYPES,
      primaryType: typedData.primaryType,
      message: typedData.message,
      signature,
    });
  }
  return await client.verifyTypedData({
    address: expectedAddress,
    domain,
    types: MCP_TOKEN_REVOKE_TYPES,
    primaryType: typedData.primaryType,
    message: typedData.message,
    signature,
  });
}

function resolveChain(chainId: number, rpcUrl: string): Chain {
  if (chainId === sepolia.id) return sepolia;
  return defineChain({
    id: chainId,
    name: `chain-${chainId}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  });
}
