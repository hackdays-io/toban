import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import type { Env } from "../src/env";
import type { IdentityClient, PlatformLink } from "../src/identity";
import { handleInternalPropose } from "../src/internal/propose";
import { decodePayload } from "../src/mcp/confirm";
import type { DiscordRest } from "../src/mcp/discord-rest";

const GUILD = "111111111111111111";
const OTHER_GUILD = "222222222222222222";
const CHANNEL = "333333333333333333";
const ACTOR = "444444444444444444";
const RECIPIENT = "555555555555555555";
const SECRET = "propose-secret";

function fakeEnv(): Env {
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
    MCP_INTERNAL_PROPOSE_SECRET: SECRET,
  };
}

const link: PlatformLink = {
  provider: "discord",
  platformId: GUILD,
  treeId: "42",
  installedBy: `0x${"ad".repeat(20)}` as Address,
};

const identityStub = (over: Partial<IdentityClient> = {}): IdentityClient => ({
  getIdentity: async () => null,
  getIdentitiesByWallet: async () => [],
  getIdentitiesByWallets: async (_provider, wallets) =>
    new Map(wallets.map((w) => [w.toLowerCase(), []])),
  getPlatformLink: async () => link,
  upsertPlatformLink: async () => {},
  getNotifyChannelId: async () => null,
  setNotifyChannelId: async () => {},
  claimInstallStateJti: async () => ({ ok: true }),
  ...over,
});

function restStub(over: Partial<DiscordRest> = {}): DiscordRest {
  return {
    getChannelGuildId: async () => GUILD,
    postMessage: async () => ({ id: "m1" }),
    editMessage: async () => {},
    ...over,
  };
}

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
): Request {
  return new Request("https://bot.example.test/internal/propose", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /internal/propose — auth", () => {
  it("rejects a request without the shared secret", async () => {
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest({
        kind: "thx",
        treeId: "42",
        channelId: CHANNEL,
        forDiscordUserId: ACTOR,
        toDiscordUserId: RECIPIENT,
        amount: 5,
      }),
      { rest: restStub(), identity: identityStub() },
    );
    expect(res.status).toBe(401);
  });

  it("rejects a request with the wrong secret", async () => {
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        {
          kind: "thx",
          treeId: "42",
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          toDiscordUserId: RECIPIENT,
          amount: 5,
        },
        { "x-toban-mcp-propose-secret": "wrong" },
      ),
      { rest: restStub(), identity: identityStub() },
    );
    expect(res.status).toBe(401);
  });

  it("fails closed when the Worker has no configured secret", async () => {
    const env = fakeEnv();
    env.MCP_INTERNAL_PROPOSE_SECRET = undefined as unknown as string;
    const res = await handleInternalPropose(
      env,
      makeRequest(
        {
          kind: "thx",
          treeId: "42",
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          toDiscordUserId: RECIPIENT,
          amount: 5,
        },
        { "x-toban-mcp-propose-secret": "anything" },
      ),
      { rest: restStub(), identity: identityStub() },
    );
    expect(res.status).toBe(401);
  });
});

describe("POST /internal/propose — reversed workspace check", () => {
  it("refuses when the channel's guild maps to a different treeId than requested", async () => {
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        {
          kind: "thx",
          treeId: "99", // does not match link.treeId ("42")
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          toDiscordUserId: RECIPIENT,
          amount: 5,
        },
        { "x-toban-mcp-propose-secret": SECRET },
      ),
      { rest: restStub(), identity: identityStub() },
    );
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toContain("ワークスペースのものではありません");
  });

  it("refuses when the channel's guild is not linked to any workspace", async () => {
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        {
          kind: "thx",
          treeId: "42",
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          toDiscordUserId: RECIPIENT,
          amount: 5,
        },
        { "x-toban-mcp-propose-secret": SECRET },
      ),
      {
        rest: restStub(),
        identity: identityStub({ getPlatformLink: async () => null }),
      },
    );
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toContain("連携されていません");
  });

  it("refuses when the bot cannot see the channel at all", async () => {
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        {
          kind: "thx",
          treeId: "42",
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          toDiscordUserId: RECIPIENT,
          amount: 5,
        },
        { "x-toban-mcp-propose-secret": SECRET },
      ),
      {
        rest: restStub({ getChannelGuildId: async () => null }),
        identity: identityStub(),
      },
    );
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
  });

  it("proceeds when the channel's guild matches the requested treeId", async () => {
    let posted: unknown = null;
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        {
          kind: "thx",
          treeId: "42",
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          toDiscordUserId: RECIPIENT,
          amount: 5,
          message: "助かりました",
        },
        { "x-toban-mcp-propose-secret": SECRET },
      ),
      {
        rest: restStub({
          postMessage: async (_c, body) => {
            posted = body;
            return { id: "m1" };
          },
        }),
        identity: identityStub(),
      },
    );
    const body = (await res.json()) as { ok: boolean; messageId?: string };
    expect(body.ok).toBe(true);
    expect(body.messageId).toBe("m1");

    // discord-bot fills ConfirmPayload.guildId itself — never from the request.
    const posted_ = posted as { embeds: { footer: { text: string } }[] };
    const payload = decodePayload(posted_.embeds[0].footer.text);
    expect(payload).toMatchObject({
      kind: "thx",
      guildId: GUILD,
      forUser: ACTOR,
    });
  });
});

describe("POST /internal/propose — validation", () => {
  it("rejects a non-positive amount", async () => {
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        {
          kind: "thx",
          treeId: "42",
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          toDiscordUserId: RECIPIENT,
          amount: 0,
        },
        { "x-toban-mcp-propose-secret": SECRET },
      ),
      { rest: restStub(), identity: identityStub() },
    );
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });

  it("rejects an invalid recipient address", async () => {
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        {
          kind: "thx",
          treeId: "42",
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          toAddress: "not-an-address",
          amount: 5,
        },
        { "x-toban-mcp-propose-secret": SECRET },
      ),
      { rest: restStub(), identity: identityStub() },
    );
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(false);
  });

  it("posts a quest-submit confirm message", async () => {
    let posted: unknown = null;
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        {
          kind: "quest",
          treeId: "42",
          channelId: CHANNEL,
          forDiscordUserId: ACTOR,
          questId: "7",
        },
        { "x-toban-mcp-propose-secret": SECRET },
      ),
      {
        rest: restStub({
          postMessage: async (_c, body) => {
            posted = body;
            return { id: "m2" };
          },
        }),
        identity: identityStub(),
      },
    );
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    const posted_ = posted as { embeds: { footer: { text: string } }[] };
    expect(decodePayload(posted_.embeds[0].footer.text)).toMatchObject({
      kind: "quest",
      questId: "7",
    });
  });

  it("rejects an unparseable request body", async () => {
    const res = await handleInternalPropose(
      fakeEnv(),
      makeRequest(
        { kind: "thx" /* missing required fields */ },
        { "x-toban-mcp-propose-secret": SECRET },
      ),
      { rest: restStub(), identity: identityStub() },
    );
    expect(res.status).toBe(400);
  });
});
