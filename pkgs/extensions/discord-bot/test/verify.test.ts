import { describe, expect, it } from "vitest";
import {
  DISCORD_INTERACTION_MAX_SKEW_SECONDS,
  verifyDiscordInteraction,
} from "../src/interactions/verify";
import { generateEd25519Pair, signEd25519 } from "./helpers";

// Frozen clock for tests; pick a representative value well clear of
// any DST / leap-second concerns.
const FIXED_NOW = 1_750_000_000;
const now = () => FIXED_NOW;
const freshTimestamp = String(FIXED_NOW);

describe("verifyDiscordInteraction", () => {
  it("accepts a valid Ed25519 signature within the freshness window", async () => {
    const { publicKeyHex, privateKey } = await generateEd25519Pair();
    const body = JSON.stringify({ type: 1 });
    const sigHex = await signEd25519(privateKey, freshTimestamp + body);

    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      sigHex,
      freshTimestamp,
      body,
      { now },
    );
    expect(ok).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const { publicKeyHex, privateKey } = await generateEd25519Pair();
    const body = JSON.stringify({ type: 1 });
    const sigHex = await signEd25519(privateKey, freshTimestamp + body);
    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      sigHex,
      freshTimestamp,
      `${body}x`,
      { now },
    );
    expect(ok).toBe(false);
  });

  it("rejects a missing signature", async () => {
    const { publicKeyHex } = await generateEd25519Pair();
    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      "",
      freshTimestamp,
      "{}",
      { now },
    );
    expect(ok).toBe(false);
  });

  it("rejects a wrong-length sig hex without throwing", async () => {
    const { publicKeyHex } = await generateEd25519Pair();
    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      "abc",
      freshTimestamp,
      "{}",
      { now },
    );
    expect(ok).toBe(false);
  });

  it("rejects a stale (replayed) timestamp outside the freshness window", async () => {
    const { publicKeyHex, privateKey } = await generateEd25519Pair();
    const staleTs = String(
      FIXED_NOW - DISCORD_INTERACTION_MAX_SKEW_SECONDS - 1,
    );
    const body = JSON.stringify({ type: 1 });
    const sigHex = await signEd25519(privateKey, staleTs + body);
    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      sigHex,
      staleTs,
      body,
      { now },
    );
    expect(ok).toBe(false);
  });

  it("rejects a non-numeric timestamp", async () => {
    const { publicKeyHex, privateKey } = await generateEd25519Pair();
    const body = "{}";
    const sigHex = await signEd25519(privateKey, `not-a-number${body}`);
    const ok = await verifyDiscordInteraction(
      publicKeyHex,
      sigHex,
      "not-a-number",
      body,
      { now },
    );
    expect(ok).toBe(false);
  });
});
