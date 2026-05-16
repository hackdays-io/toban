import { importSPKI, jwtVerify } from "jose";
import { describe, expect, it } from "vitest";
import {
  VERIFIER_ALG,
  VERIFIER_ISSUER,
  VERIFIER_TOKEN_TTL_SECONDS,
  issueVerifierToken,
} from "../src/verifier";
import { generateEs256Pair } from "./helpers";

describe("issueVerifierToken", () => {
  it("issues a JWT we can self-verify with the matching public key", async () => {
    const { privateKeyPem, publicKeyPem } = await generateEs256Pair();
    const accountId = "1234567890";
    const now = 1_700_000_000;

    const token = await issueVerifierToken(privateKeyPem, accountId, now);
    const publicKey = await importSPKI(publicKeyPem, VERIFIER_ALG);
    const { payload, protectedHeader } = await jwtVerify(token, publicKey, {
      issuer: VERIFIER_ISSUER,
      currentDate: new Date(now * 1000),
    });
    expect(protectedHeader.alg).toBe("ES256");
    expect(payload.provider).toBe("discord");
    expect(payload.accountId).toBe(accountId);
    expect(payload.exp).toBe(now + VERIFIER_TOKEN_TTL_SECONDS);
    expect(payload.iat).toBe(now);
    expect(payload.iss).toBe(VERIFIER_ISSUER);
  });

  it("rejects empty accountId", async () => {
    const { privateKeyPem } = await generateEs256Pair();
    await expect(issueVerifierToken(privateKeyPem, "")).rejects.toThrow();
  });
});
