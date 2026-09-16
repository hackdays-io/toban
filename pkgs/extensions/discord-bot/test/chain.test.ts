import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import {
  resolveMembershipHatId,
  resolveQuestModuleAddress,
  resolveRelatedRoles,
  resolveSubmittableQuests,
  resolveThanksTokenAddress,
} from "../src/chain";
import type { Env } from "../src/env";

const GOLDSKY_ENDPOINT = "https://goldsky.example.invalid/graphql";
const HATS_ENDPOINT = "https://hats.example.invalid/graphql";
const WALLET = `0x${"a1".repeat(20)}` as Address;

function fakeEnv(over: Partial<Env> = {}): Env {
  return {
    DB: {} as unknown as D1Database,
    IDENTITY: {} as unknown as Fetcher,
    GOLDSKY_GRAPHQL_ENDPOINT: GOLDSKY_ENDPOINT,
    HATS_GRAPHQL_ENDPOINT: HATS_ENDPOINT,
    TOBAN_FRONTEND_URL: "https://toban.xyz",
    BOT_WORKER_URL: "https://bot.example.invalid",
    RPC_URL: "https://example.invalid",
    CHAIN_ID: "8453",
    TURNKEY_API_BASE_URL: "https://api.turnkey.com",
    TURNKEY_ORGANIZATION_ID: "org",
    TURNKEY_BOT_SIGNER_ADDRESS: `0x${"bb".repeat(20)}`,
    IDENTITY_WORKER_URL: "https://id.example.invalid",
    DISCORD_PUBLIC_KEY: "",
    DISCORD_BOT_TOKEN: "",
    DISCORD_APP_ID: "appid",
    DISCORD_CLIENT_SECRET: "",
    TURNKEY_API_PUBLIC_KEY: "",
    TURNKEY_API_PRIVATE_KEY: "",
    VERIFIER_PRIVATE_KEY: "",
    INSTALL_STATE_SECRET: "",
    PLATFORM_LINK_WRITE_SECRET: "",
    LOOKUP_READ_SECRET: "",
    ...over,
  };
}

/** Records the Authorization header of every GraphQL POST, answering `{}`. */
function recordingFetch(): {
  fetchImpl: typeof fetch;
  calls: { endpoint: string; authorization: string | null }[];
} {
  const calls: { endpoint: string; authorization: string | null }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({
      endpoint: String(url),
      authorization: new Headers(init.headers).get("authorization"),
    });
    return new Response(JSON.stringify({ data: {} }), {
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

async function callEveryResolver(env: Env) {
  const { fetchImpl, calls } = recordingFetch();
  await resolveThanksTokenAddress(env, "42", fetchImpl);
  await resolveQuestModuleAddress(env, "42", fetchImpl);
  await resolveSubmittableQuests(env, "42", WALLET, fetchImpl);
  await resolveMembershipHatId(env, WALLET, "42", fetchImpl);
  await resolveRelatedRoles(env, WALLET, "42", fetchImpl);
  return calls;
}

describe("Goldsky API key", () => {
  // On Base the Hats endpoint is The Graph — a third party that must never
  // see the Goldsky token.
  it("sends GOLDSKY_API_KEY to Goldsky and never to the Hats endpoint", async () => {
    const calls = await callEveryResolver(
      fakeEnv({ GOLDSKY_API_KEY: "goldsky-key" }),
    );
    const goldsky = calls.filter((c) => c.endpoint === GOLDSKY_ENDPOINT);
    const hats = calls.filter((c) => c.endpoint === HATS_ENDPOINT);
    // thanks-token, quest-module, quests, related-roles (fraction rows)
    expect(goldsky).toHaveLength(4);
    // membership, related-roles (worn hats)
    expect(hats).toHaveLength(2);
    for (const c of goldsky) expect(c.authorization).toBe("Bearer goldsky-key");
    for (const c of hats) expect(c.authorization).toBeNull();
  });

  it("sends no Authorization header when the key is unset", async () => {
    const calls = await callEveryResolver(fakeEnv());
    expect(calls).toHaveLength(6);
    for (const c of calls) expect(c.authorization).toBeNull();
  });
});
