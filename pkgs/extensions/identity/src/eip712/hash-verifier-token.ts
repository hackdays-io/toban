import { keccak256, toBytes } from "viem";
import type { Hex } from "viem";

/**
 * `verifierTokenHash = keccak256(utf8Bytes(verifier_token))`.
 *
 * Returned as a `0x`-prefixed 32-byte hex string (the `bytes32` field
 * of `IdentityBinding`).
 */
export function hashVerifierToken(verifierToken: string): Hex {
  return keccak256(toBytes(verifierToken));
}
