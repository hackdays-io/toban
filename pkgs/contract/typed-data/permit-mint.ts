/**
 * EIP-712 TypedData definitions for `ThanksToken.permitMint`.
 *
 * This file is consumed by:
 *   - `pkgs/frontend` (signing flows from a connected wallet)
 *   - `pkgs/extensions/discord-bot` (bot verifies signatures it requests)
 *
 * It is intentionally framework-agnostic (no viem / ethers imports) so it can
 * be imported from any TypeScript runtime (Cloudflare Workers, Node, browser).
 */

/**
 * EIP-712 domain values for a deployed ThanksToken instance.
 *
 * `name` and `version` MUST match the values passed to OpenZeppelin's
 * `EIP712("ThanksToken", "1")` constructor in
 * `pkgs/contract/contracts/thankstoken/ThanksToken.sol`.
 *
 * `verifyingContract` is the address of the *clone* (not the implementation),
 * because the contract rebuilds the domain separator per-instance using
 * `address(this)` to remain clone-safe.
 */
export type PermitMintDomain = {
  name: "ThanksToken";
  version: "1";
  chainId: number;
  verifyingContract: `0x${string}`;
};

/**
 * EIP-712 type definitions for the PermitMint struct.
 *
 * Matches the Solidity typehash:
 *   PermitMint(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)
 */
export const PERMIT_MINT_TYPES = {
  PermitMint: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

/** Primary EIP-712 type name for `permitMint` signatures. */
export const PERMIT_MINT_PRIMARY_TYPE = "PermitMint" as const;

/**
 * Concrete message payload to sign for `permitMint`.
 *
 * Values are encoded as strings/numbers compatible with both viem
 * (`signTypedData`) and ethers (`signTypedData`) — bigints stringify cleanly.
 */
export type PermitMintMessage = {
  owner: `0x${string}`;
  spender: `0x${string}`;
  value: bigint;
  nonce: bigint;
  deadline: bigint;
};

/**
 * Builds a complete EIP-712 typed data payload for `permitMint`.
 *
 * Example (viem):
 * ```ts
 * const typedData = buildPermitMintTypedData({
 *   domain: buildPermitMintDomain({ chainId, verifyingContract: thanksTokenAddress }),
 *   message,
 * });
 * const signature = await walletClient.signTypedData(typedData);
 * ```
 */
export function buildPermitMintTypedData(input: {
  domain: PermitMintDomain;
  message: PermitMintMessage;
}) {
  return {
    domain: input.domain,
    types: PERMIT_MINT_TYPES,
    primaryType: PERMIT_MINT_PRIMARY_TYPE,
    message: input.message,
  } as const;
}

/**
 * Convenience builder for the EIP-712 domain object.
 *
 * `name` and `version` are fixed to match the ThanksToken contract; callers
 * only supply the per-instance fields (chainId + verifyingContract).
 */
export function buildPermitMintDomain(input: {
  chainId: number;
  verifyingContract: `0x${string}`;
}): PermitMintDomain {
  return {
    name: "ThanksToken",
    version: "1",
    chainId: input.chainId,
    verifyingContract: input.verifyingContract,
  };
}

/**
 * Solidity-side typehash for the PermitMint struct, exposed for parity with
 * the on-chain `PERMIT_MINT_TYPEHASH` constant. Useful for debugging or
 * verification flows that re-derive the digest off-chain.
 */
export const PERMIT_MINT_TYPE_STRING =
  "PermitMint(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)" as const;
