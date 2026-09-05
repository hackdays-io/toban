import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import type { Address, Hex } from "viem";
import { describe, expect, it, vi } from "vitest";
import type { Env } from "../src/env";
import type { IdentityClient, PlatformLink } from "../src/identity";
import { authenticate, issueGuildToken } from "../src/mcp/auth";
import {
  handleConfirmButton,
  isConfirmComponent,
  readPayload,
} from "../src/mcp/button";
import {
  CANCEL_CUSTOM_ID,
  CONFIRM_CUSTOM_ID,
  buildConfirmMessage,
  decodePayload,
  encodePayload,
} from "../src/mcp/confirm";
import type { DiscordRest } from "../src/mcp/discord-rest";
import { handleRpc } from "../src/mcp/protocol";
import { TOOL_DEFINITIONS, callTool } from "../src/mcp/tools";

const GUILD = "111111111111111111";
const OTHER_GUILD = "222222222222222222";
const CHANNEL = "333333333333333333";
const ACTOR = "444444444444444444";
const RECIPIENT = "555555555555555555";
const SECRET = "test-secret";

const link: PlatformLink = {
  provider: "discord",
  platformId: GUILD,
  treeId: "42",
  installedBy: `0x${"ad".repeat(20)}` as Address,
};

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
    MCP_TOKEN_SECRET: SECRET,
  };
}

const identityStub = (over: Partial<IdentityClient> = {}): IdentityClient => ({
  getIdentity: async () => null,
  getPlatformLink: async () => link,
  upsertPlatformLink: async () => {},
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

// ---------------------------------------------------------------- auth

describe("guild-scoped tokens", () => {
  it("round-trips and reports the guild the bearer may act for", async () => {
    const token = await issueGuildToken(SECRET, GUILD);
    const auth = await authenticate(SECRET, `Bearer ${token}`);
    expect(auth).toEqual({ ok: true, guildId: GUILD });
  });

  it("rejects a token minted with a different secret", async () => {
    const token = await issueGuildToken("other-secret", GUILD);
    const auth = await authenticate(SECRET, `Bearer ${token}`);
    expect(auth.ok).toBe(false);
  });

  it("rejects a token whose guild was swapped", async () => {
    const token = await issueGuildToken(SECRET, GUILD);
    const [prefix, , macPart] = token.split(".");
    const forged = [prefix, OTHER_GUILD, macPart].join(".");
    const auth = await authenticate(SECRET, `Bearer ${forged}`);
    expect(auth.ok).toBe(false);
  });

  it("fails closed when the secret is unset", async () => {
    const auth = await authenticate(undefined, "Bearer whatever");
    expect(auth).toMatchObject({ ok: false, status: 500 });
  });

  it("rejects a missing or malformed header", async () => {
    expect((await authenticate(SECRET, null)).ok).toBe(false);
    expect((await authenticate(SECRET, "Bearer nope")).ok).toBe(false);
  });
});

// ------------------------------------------------------------ protocol

describe("MCP protocol", () => {
  const deps = {
    serverName: "toban",
    serverVersion: "0.1.0",
    tools: TOOL_DEFINITIONS,
    callTool: async (name: string) =>
      name === "boom" ? { text: "no", isError: true } : { text: "yes" },
  };

  it("echoes the client's protocol version on initialize", async () => {
    const res = (await handleRpc(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2024-11-05" },
      },
      deps,
    )) as { result: { protocolVersion: string } };
    expect(res.result.protocolVersion).toBe("2024-11-05");
  });

  it("lists tools", async () => {
    const res = (await handleRpc(
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
      deps,
    )) as { result: { tools: { name: string }[] } };
    expect(res.result.tools.map((t) => t.name)).toContain("toban_thx_propose");
  });

  it("returns a tool refusal as a successful result with isError", async () => {
    const res = (await handleRpc(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "boom" } },
      deps,
    )) as { result: { isError: boolean } };
    expect(res.result.isError).toBe(true);
  });

  it("answers notifications with nothing", async () => {
    expect(
      await handleRpc(
        { jsonrpc: "2.0", method: "notifications/initialized" },
        deps,
      ),
    ).toBeNull();
  });

  it("rejects non-JSON-RPC payloads and unknown methods", async () => {
    expect(await handleRpc({ hello: "world" }, deps)).toMatchObject({
      error: { code: -32600 },
    });
    expect(
      await handleRpc({ jsonrpc: "2.0", id: 9, method: "nope" }, deps),
    ).toMatchObject({ error: { code: -32601 } });
  });
});

// ------------------------------------------------------------- confirm

describe("confirm payload", () => {
  it("round-trips through the embed footer, multibyte text included", () => {
    const payload = {
      kind: "thx" as const,
      guildId: GUILD,
      forUser: ACTOR,
      target: { user: RECIPIENT },
      amount: "5",
      message: "ありがとう🙏",
    };
    expect(decodePayload(encodePayload(payload))).toEqual(payload);
  });

  it("ignores footers that are not ours", () => {
    expect(decodePayload("just some text")).toBeNull();
    expect(decodePayload(undefined)).toBeNull();
    expect(decodePayload("toban:v1:!!!not-base64!!!")).toBeNull();
  });

  it("pings only the person who may press the button", () => {
    const msg = buildConfirmMessage({
      kind: "thx",
      guildId: GUILD,
      forUser: ACTOR,
      target: { user: RECIPIENT },
      amount: "5",
      message: "@everyone",
    });
    expect(msg.allowed_mentions).toEqual({ parse: [], users: [ACTOR] });
  });
});

// -------------------------------------------------------------- tools

describe("propose tools", () => {
  it("refuses a channel that belongs to another guild", async () => {
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_propose",
      {
        channelId: CHANNEL,
        forDiscordUserId: ACTOR,
        toDiscordUserId: RECIPIENT,
        amount: 5,
      },
      {
        identity: identityStub(),
        rest: restStub({ getChannelGuildId: async () => OTHER_GUILD }),
      },
    );
    expect(res.isError).toBe(true);
  });

  it("posts a confirm message and says nothing was sent yet", async () => {
    const posted: unknown[] = [];
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_propose",
      {
        channelId: CHANNEL,
        forDiscordUserId: ACTOR,
        toDiscordUserId: RECIPIENT,
        amount: 5,
        message: "助かりました",
      },
      {
        identity: identityStub(),
        rest: restStub({
          postMessage: async (_c, body) => {
            posted.push(body);
            return { id: "m1" };
          },
        }),
      },
    );
    expect(res.isError).toBeUndefined();
    expect(res.text).toContain("まだ何も送られていません");
    const body = posted[0] as { embeds: { footer: { text: string } }[] };
    expect(decodePayload(body.embeds[0].footer.text)).toMatchObject({
      kind: "thx",
      guildId: GUILD,
      forUser: ACTOR,
      amount: "5",
    });
  });

  it("reports an unlinked guild instead of guessing a workspace", async () => {
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_workspace_info",
      {},
      { identity: identityStub({ getPlatformLink: async () => null }) },
    );
    expect(res.isError).toBe(true);
    expect(res.text).toContain("連携されていません");
  });

  it("rejects a non-positive amount", async () => {
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_propose",
      {
        channelId: CHANNEL,
        forDiscordUserId: ACTOR,
        toDiscordUserId: RECIPIENT,
        amount: 0,
      },
      { identity: identityStub(), rest: restStub() },
    );
    expect(res.isError).toBe(true);
  });
});

// ------------------------------------------------------------- button

function fakeCtx(): ExecutionContext {
  const pending: Promise<unknown>[] = [];
  return {
    waitUntil: (p: Promise<unknown>) => pending.push(p),
    passThroughOnException: () => {},
    props: {},
    // exposed for the tests below
    _pending: pending,
  } as unknown as ExecutionContext;
}

function settle(ctx: ExecutionContext): Promise<unknown[]> {
  return Promise.all(
    (ctx as unknown as { _pending: Promise<unknown>[] })._pending,
  );
}

function componentInteraction(
  clicker: string,
  customId: string,
  footer: string,
  guildId = GUILD,
): APIMessageComponentInteraction {
  return {
    id: "i1",
    application_id: "appid",
    type: 3,
    token: "tok",
    version: 1,
    guild_id: guildId,
    channel: { id: CHANNEL } as never,
    member: { user: { id: clicker } } as never,
    data: { custom_id: customId, component_type: 2 },
    message: {
      id: "m1",
      content: "",
      embeds: [{ footer: { text: footer } }],
    } as never,
  } as unknown as APIMessageComponentInteraction;
}

describe("confirm button", () => {
  const payload = {
    kind: "thx" as const,
    guildId: GUILD,
    forUser: ACTOR,
    target: { user: RECIPIENT },
    amount: "5",
    message: "ありがとう",
  };

  it("recognises only its own components", () => {
    expect(isConfirmComponent(CONFIRM_CUSTOM_ID)).toBe(true);
    expect(isConfirmComponent("something:else")).toBe(false);
  });

  it("refuses a click from anyone but the addressee", async () => {
    const ctx = fakeCtx();
    const perform = vi.fn();
    const res = handleConfirmButton(
      fakeEnv(),
      ctx,
      componentInteraction("999", CONFIRM_CUSTOM_ID, encodePayload(payload)),
      { rest: restStub(), performThx: perform as never },
    );
    expect(JSON.stringify(res)).toContain("本人が押してください");
    expect(perform).not.toHaveBeenCalled();
  });

  it("refuses when the interaction's guild differs from the payload", async () => {
    const ctx = fakeCtx();
    const perform = vi.fn();
    handleConfirmButton(
      fakeEnv(),
      ctx,
      componentInteraction(
        ACTOR,
        CONFIRM_CUSTOM_ID,
        encodePayload(payload),
        OTHER_GUILD,
      ),
      { rest: restStub(), performThx: perform as never },
    );
    expect(perform).not.toHaveBeenCalled();
  });

  it("signs as the clicker, not as anyone named in the proposal", async () => {
    const ctx = fakeCtx();
    const perform = vi.fn(async (_env: unknown, _params: unknown) => ({
      ok: true as const,
      txHash: `0x${"ab".repeat(32)}` as Hex,
      recipientWallet: `0x${"cd".repeat(20)}` as Address,
      recipientLabel: `<@${RECIPIENT}>`,
      amount: 5n,
      message: "ありがとう",
    }));
    const sent: string[] = [];
    handleConfirmButton(
      fakeEnv(),
      ctx,
      componentInteraction(ACTOR, CONFIRM_CUSTOM_ID, encodePayload(payload)),
      {
        rest: restStub(),
        performThx: perform as never,
        followup: async (_a, _t, content) => {
          sent.push(content);
        },
      },
    );
    await settle(ctx);
    expect(perform).toHaveBeenCalledOnce();
    expect(perform.mock.calls[0][1]).toMatchObject({
      actorSf: ACTOR,
      guildId: GUILD,
    });
    expect(sent[0]).toContain("Tx:");
  });

  it("strips the buttons before doing the work", async () => {
    const ctx = fakeCtx();
    const edits: unknown[] = [];
    handleConfirmButton(
      fakeEnv(),
      ctx,
      componentInteraction(ACTOR, CONFIRM_CUSTOM_ID, encodePayload(payload)),
      {
        rest: restStub({
          editMessage: async (_c, _m, body) => {
            edits.push(body);
          },
        }),
        performThx: (async () => ({ ok: false, error: "nope" })) as never,
        followup: async () => {},
      },
    );
    await settle(ctx);
    expect(edits[0]).toMatchObject({ components: [] });
  });

  it("cancels without touching the chain", async () => {
    const ctx = fakeCtx();
    const perform = vi.fn();
    const res = handleConfirmButton(
      fakeEnv(),
      ctx,
      componentInteraction(ACTOR, CANCEL_CUSTOM_ID, encodePayload(payload)),
      { rest: restStub(), performThx: perform as never },
    );
    await settle(ctx);
    expect(JSON.stringify(res)).toContain("やめました");
    expect(perform).not.toHaveBeenCalled();
  });

  it("reads the payload back out of the embed footer", () => {
    const interaction = componentInteraction(
      ACTOR,
      CONFIRM_CUSTOM_ID,
      encodePayload(payload),
    );
    expect(readPayload(interaction)).toEqual(payload);
  });
});
