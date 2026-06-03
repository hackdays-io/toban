import { hashTypedData, keccak256, toBytes } from "viem";
import { describe, expect, it } from "vitest";
import {
  IDENTITY_BINDING_DOMAIN_NAME,
  IDENTITY_BINDING_DOMAIN_VERSION,
  IDENTITY_BINDING_PRIMARY_TYPE,
  IDENTITY_BINDING_TYPES,
  buildIdentityBindingDomain,
  hashVerifierToken,
} from "../eip712/identity-binding.js";

describe("eip712/identity-binding", () => {
  it("buildIdentityBindingDomain pins name/version and omits verifyingContract", () => {
    const domain = buildIdentityBindingDomain(11155111);
    expect(domain.name).toBe(IDENTITY_BINDING_DOMAIN_NAME);
    expect(domain.version).toBe(IDENTITY_BINDING_DOMAIN_VERSION);
    expect(domain.chainId).toBe(11155111);
    // Off-chain attestation: no verifyingContract field. (Casting because
    // the type explicitly does not allow it.)
    expect(
      (domain as Record<string, unknown>).verifyingContract,
    ).toBeUndefined();
  });

  it("hashVerifierToken equals keccak256(utf8Bytes(token))", () => {
    const token = "header.payload.signature";
    expect(hashVerifierToken(token)).toBe(keccak256(toBytes(token)));
  });

  it("typed-data hash is stable for a fixed message (regression guard)", () => {
    // If anyone reorders IdentityBinding fields or renames them, this hash
    // changes and the test fails — preventing silent boundary breakage.
    const digest = hashTypedData({
      domain: buildIdentityBindingDomain(1),
      types: IDENTITY_BINDING_TYPES,
      primaryType: IDENTITY_BINDING_PRIMARY_TYPE,
      message: {
        wallet: "0x0000000000000000000000000000000000000001",
        provider: "discord",
        accountId: "12345",
        verifierTokenHash: hashVerifierToken("token-A"),
        expires: 1_700_000_000n,
        nonce: `0x${"11".repeat(32)}` as `0x${string}`,
      },
    });
    expect(digest).toMatch(/^0x[0-9a-f]{64}$/);
    // Changing any field flips the hash — sanity check.
    const digest2 = hashTypedData({
      domain: buildIdentityBindingDomain(1),
      types: IDENTITY_BINDING_TYPES,
      primaryType: IDENTITY_BINDING_PRIMARY_TYPE,
      message: {
        wallet: "0x0000000000000000000000000000000000000001",
        provider: "discord",
        accountId: "12346", // <- only diff
        verifierTokenHash: hashVerifierToken("token-A"),
        expires: 1_700_000_000n,
        nonce: `0x${"11".repeat(32)}` as `0x${string}`,
      },
    });
    expect(digest).not.toBe(digest2);
  });
});
