import { keccak256, toBytes } from "viem";
import type { Address, Hex } from "viem";

/**
 * EIP-712 `IdentityBinding` boundary contract.
 *
 * This shape is the wire contract shared with every Toban extension
 * (discord-bot, slack-bot, ...) and the frontend `/connect` page. Do not
 * reorder fields, rename them, or alter their `type` strings without
 * coordinating across all consumers — the typed-data hash depends on
 * the field order.
 */
export const IDENTITY_BINDING_PRIMARY_TYPE = "IdentityBinding" as const;

export const IDENTITY_BINDING_TYPES = {
  IdentityBinding: [
    { name: "wallet", type: "address" },
    { name: "provider", type: "string" },
    { name: "accountId", type: "string" },
    { name: "verifierTokenHash", type: "bytes32" },
    { name: "expires", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export const IDENTITY_BINDING_DOMAIN_NAME = "TobanIdentity" as const;
export const IDENTITY_BINDING_DOMAIN_VERSION = "1" as const;

export type IdentityBindingDomain = {
  name: typeof IDENTITY_BINDING_DOMAIN_NAME;
  version: typeof IDENTITY_BINDING_DOMAIN_VERSION;
  chainId: number;
  // No `verifyingContract`: this is an off-chain attestation.
};

export type IdentityBindingMessage = {
  wallet: Address;
  provider: string;
  accountId: string;
  verifierTokenHash: Hex;
  expires: bigint;
  nonce: Hex;
};

export type IdentityBindingTypedData = {
  domain: IdentityBindingDomain;
  types: typeof IDENTITY_BINDING_TYPES;
  primaryType: typeof IDENTITY_BINDING_PRIMARY_TYPE;
  message: IdentityBindingMessage;
};

/**
 * Build the EIP-712 domain for a given network. `verifyingContract` is
 * intentionally omitted — IdentityBinding is purely off-chain so binding
 * to a single contract address would only restrict signers needlessly.
 */
export function buildIdentityBindingDomain(
  chainId: number,
): IdentityBindingDomain {
  return {
    name: IDENTITY_BINDING_DOMAIN_NAME,
    version: IDENTITY_BINDING_DOMAIN_VERSION,
    chainId,
  };
}

/**
 * `verifierTokenHash = keccak256(utf8Bytes(verifier_token))`.
 *
 * Returned as a `0x`-prefixed 32-byte hex string (the `bytes32` field
 * of `IdentityBinding`).
 */
export function hashVerifierToken(verifierToken: string): Hex {
  return keccak256(toBytes(verifierToken));
}
