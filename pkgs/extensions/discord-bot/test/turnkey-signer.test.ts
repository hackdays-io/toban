import {
  type Hex,
  hexToBytes,
  keccak256,
  parseTransaction,
  recoverAddress,
  serializeTransaction,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { generatePrivateKey } from "viem/accounts";
import { describe, expect, it } from "vitest";
import { __testing, createTurnkeySigner } from "../src/signer/turnkey";

/**
 * The Turnkey wrapper's job is to take whatever 32-byte hash viem
 * hands it, produce (r, s, v), and reassemble those into the same
 * signed payload that a local viem signer would produce.
 *
 * Strategy: we generate a viem-local private key, simulate Turnkey by
 * having our `overrideFetcher` sign the hash with that key, then
 * assert that the signed transaction recovers to the same address.
 */

function makeEnv(address: string) {
  return {
    DB: {} as unknown as D1Database,
    IDENTITY: {} as unknown as Fetcher,
    GOLDSKY_GRAPHQL_ENDPOINT: "https://goldsky.example.invalid/graphql",
    HATS_GRAPHQL_ENDPOINT: "https://hats.example.invalid/graphql",
    TOBAN_FRONTEND_URL: "https://toban.xyz",
    BOT_WORKER_URL: "https://bot.example.invalid",
    RPC_URL: "https://example.invalid",
    CHAIN_ID: "8453",
    TURNKEY_API_BASE_URL: "https://api.turnkey.com",
    TURNKEY_ORGANIZATION_ID: "org",
    TURNKEY_BOT_SIGNER_ADDRESS: address,
    IDENTITY_WORKER_URL: "https://id.example.invalid",
    DISCORD_PUBLIC_KEY: "",
    DISCORD_BOT_TOKEN: "",
    DISCORD_APP_ID: "",
    DISCORD_CLIENT_SECRET: "",
    TURNKEY_API_PUBLIC_KEY: "",
    TURNKEY_API_PRIVATE_KEY: "",
    VERIFIER_PRIVATE_KEY: "",
    INSTALL_STATE_SECRET: "",
    PLATFORM_LINK_WRITE_SECRET: "",
    LOOKUP_READ_SECRET: "",
  };
}

describe("createTurnkeySigner", () => {
  it("produces a transaction that recovers to the signer address", async () => {
    const pk = generatePrivateKey();
    const local = privateKeyToAccount(pk);
    const env = makeEnv(local.address);

    const signer = createTurnkeySigner(env, async (hash: Hex) => {
      // Real Turnkey would not do this — but signing the hash with
      // viem's local account is structurally identical, and gives us
      // a deterministic recovery target.
      const sig = await local.sign({ hash });
      // viem's sig is a 65-byte 0x... string: r(32) | s(32) | v(1)
      const bytes = sig.startsWith("0x") ? sig.slice(2) : sig;
      const r = `0x${bytes.slice(0, 64)}` as Hex;
      const s = `0x${bytes.slice(64, 128)}` as Hex;
      // Feed the *legacy* (27/28) v form rather than reproducing the
      // 00/01 shape production assumes today — this exercises
      // `vToYParity`'s legacy branch end-to-end instead of testing the
      // mock against itself.
      const v = `0x${bytes.slice(128, 130)}` as Hex;
      return { r, s, v };
    });

    const tx = {
      chainId: 8453,
      to: `0x${"22".repeat(20)}` as Hex,
      value: 0n,
      nonce: 7,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      gas: 100_000n,
      data: "0xdeadbeef" as Hex,
      type: "eip1559" as const,
    };
    const signed = await signer.signTransaction(tx);

    // Round-trip: parse the signed tx and recover its sender.
    const parsed = parseTransaction(signed);
    // Re-serialize unsigned form and hash, then recover.
    const unsignedSerialized = serializeTransaction(tx);
    const hash = keccak256(hexToBytes(unsignedSerialized));
    expect(parsed.r).toBeDefined();
    expect(parsed.s).toBeDefined();
    const recovered = await recoverAddress({
      hash,
      signature: {
        r: parsed.r as Hex,
        s: parsed.s as Hex,
        yParity: parsed.yParity ?? 0,
      },
    });
    expect(recovered.toLowerCase()).toBe(local.address.toLowerCase());
  });

  it("signMessage delegates to the same fetcher and returns a hex signature", async () => {
    const pk = generatePrivateKey();
    const local = privateKeyToAccount(pk);
    const env = makeEnv(local.address);
    let calls = 0;
    const signer = createTurnkeySigner(env, async (hash: Hex) => {
      calls++;
      const sig = await local.sign({ hash });
      const bytes = sig.startsWith("0x") ? sig.slice(2) : sig;
      const r = `0x${bytes.slice(0, 64)}` as Hex;
      const s = `0x${bytes.slice(64, 128)}` as Hex;
      const v = `0x${bytes.slice(128, 130)}` as Hex;
      return { r, s, v };
    });
    const out = await signer.signMessage({ message: "hello" });
    expect(out.startsWith("0x")).toBe(true);
    expect(out.length).toBe(2 + 130);
    expect(calls).toBe(1);
  });
});

describe("vToYParity", () => {
  const { vToYParity } = __testing;

  it.each([
    ["0x00", 0],
    ["0x01", 1],
    ["0x1b", 0], // legacy 27
    ["0x1c", 1], // legacy 28
  ] as const)("maps %s -> yParity %i", (v, expected) => {
    expect(vToYParity(v)).toBe(expected);
  });

  it("throws on an unexpected v byte instead of silently mis-mapping", () => {
    // EIP-155 form (chainId*2+35) and anything else must be rejected so a
    // wrong yParity never reaches ecrecover.
    expect(() => vToYParity("0x25")).toThrow(/unexpected v byte/);
    expect(() => vToYParity("0x02")).toThrow(/unexpected v byte/);
  });
});
