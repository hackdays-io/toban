import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { DISCORD_VERIFIER_ISSUER } from "../providers/discord.js";
import { JwtVerificationError, verifyJwtES256 } from "../verify.js";
import { makeEs256Keys, signDiscordVerifierToken } from "./fixtures.js";

describe("verify/verifyJwtES256", () => {
  it("returns claims on a valid token", async () => {
    const keys = await makeEs256Keys();
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = await signDiscordVerifierToken({
      privateKey: keys.privateKey,
      accountId: "123456789012345678",
      expSeconds: exp,
    });
    const claims = await verifyJwtES256(
      token,
      keys.publicKeyPem,
      DISCORD_VERIFIER_ISSUER,
    );
    expect(claims.accountId).toBe("123456789012345678");
    expect(claims.provider).toBe("discord");
    expect(claims.iss).toBe(DISCORD_VERIFIER_ISSUER);
    expect(claims.exp).toBe(exp);
  });

  it("throws `expired` when token is past its exp", async () => {
    const keys = await makeEs256Keys();
    const token = await signDiscordVerifierToken({
      privateKey: keys.privateKey,
      accountId: "1",
      expSeconds: Math.floor(Date.now() / 1000) - 10,
    });
    await expect(
      verifyJwtES256(token, keys.publicKeyPem, DISCORD_VERIFIER_ISSUER),
    ).rejects.toMatchObject({ code: "expired" });
  });

  it("throws `invalid_signature` when signed by a different key", async () => {
    const keysA = await makeEs256Keys();
    const keysB = await makeEs256Keys();
    const token = await signDiscordVerifierToken({
      privateKey: keysA.privateKey,
      accountId: "1",
      expSeconds: Math.floor(Date.now() / 1000) + 60,
    });
    await expect(
      verifyJwtES256(token, keysB.publicKeyPem, DISCORD_VERIFIER_ISSUER),
    ).rejects.toMatchObject({ code: "invalid_signature" });
  });

  it("throws `wrong_issuer` when iss does not match", async () => {
    const keys = await makeEs256Keys();
    const token = await signDiscordVerifierToken({
      privateKey: keys.privateKey,
      accountId: "1",
      expSeconds: Math.floor(Date.now() / 1000) + 60,
      issuer: "rogue-bot",
    });
    await expect(
      verifyJwtES256(token, keys.publicKeyPem, DISCORD_VERIFIER_ISSUER),
    ).rejects.toMatchObject({ code: "wrong_issuer" });
  });

  it("throws `missing_claim` when accountId is absent", async () => {
    const keys = await makeEs256Keys();
    const token = await new SignJWT({ provider: "discord" })
      .setProtectedHeader({ alg: "ES256" })
      .setIssuer(DISCORD_VERIFIER_ISSUER)
      .setExpirationTime(Math.floor(Date.now() / 1000) + 60)
      .sign(keys.privateKey);
    await expect(
      verifyJwtES256(token, keys.publicKeyPem, DISCORD_VERIFIER_ISSUER),
    ).rejects.toBeInstanceOf(JwtVerificationError);
  });

  it("throws `invalid_token` on a structurally broken token", async () => {
    const keys = await makeEs256Keys();
    await expect(
      verifyJwtES256("not.a.jwt", keys.publicKeyPem, DISCORD_VERIFIER_ISSUER),
    ).rejects.toMatchObject({ code: "invalid_token" });
  });

  it("throws `invalid_public_key` on malformed PEM", async () => {
    const keys = await makeEs256Keys();
    const token = await signDiscordVerifierToken({
      privateKey: keys.privateKey,
      accountId: "1",
      expSeconds: Math.floor(Date.now() / 1000) + 60,
    });
    await expect(
      verifyJwtES256(token, "not a pem", DISCORD_VERIFIER_ISSUER),
    ).rejects.toMatchObject({ code: "invalid_public_key" });
  });
});
