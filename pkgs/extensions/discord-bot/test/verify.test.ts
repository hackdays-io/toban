import { describe, expect, it } from "vitest";
import { verifyDiscordInteraction } from "../src/interactions/verify";
import { generateEd25519Pair, signEd25519 } from "./helpers";

describe("verifyDiscordInteraction", () => {
  it("accepts a valid Ed25519 signature", async () => {
    const { publicKeyHex, privateKey } = await generateEd25519Pair();
    const timestamp = "1700000000";
    const body = JSON.stringify({ type: 1 });
    const sigHex = await signEd25519(privateKey, timestamp + body);

    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      sigHex,
      timestamp,
      body,
    );
    expect(ok).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const { publicKeyHex, privateKey } = await generateEd25519Pair();
    const timestamp = "1700000000";
    const body = JSON.stringify({ type: 1 });
    const sigHex = await signEd25519(privateKey, timestamp + body);
    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      sigHex,
      timestamp,
      `${body}x`,
    );
    expect(ok).toBe(false);
  });

  it("rejects a missing signature", async () => {
    const { publicKeyHex } = await generateEd25519Pair();
    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      "",
      "1700000000",
      "{}",
    );
    expect(ok).toBe(false);
  });

  it("rejects a wrong-length sig hex without throwing", async () => {
    const { publicKeyHex } = await generateEd25519Pair();
    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      "abc",
      "1700000000",
      "{}",
    );
    expect(ok).toBe(false);
  });
});
