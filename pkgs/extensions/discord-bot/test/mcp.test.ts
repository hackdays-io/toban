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
import { decodeThanksMessage, unitsFor } from "../src/mcp/queries";
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

// ------------------------------------------------------- subgraph reads

const HATS_ENDPOINT = "https://hats.example.invalid/graphql";
const WALLET_A = `0x${"a1".repeat(20)}`;
const WALLET_B = `0x${"b2".repeat(20)}`;

interface GraphCall {
  endpoint: string;
  query: string;
  variables: Record<string, unknown>;
}

/**
 * Route a stubbed GraphQL POST by the root field it selects. Every call is
 * recorded so a test can assert what the tool actually asked the indexer —
 * workspace scoping is a security property, not a formatting detail.
 */
function graphStub(responder: (call: GraphCall) => unknown): {
  fetchImpl: typeof fetch;
  calls: GraphCall[];
} {
  const calls: GraphCall[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as {
      query: string;
      variables: Record<string, unknown>;
    };
    const call = {
      endpoint: String(url),
      query: body.query,
      variables: body.variables,
    };
    calls.push(call);
    return new Response(JSON.stringify({ data: responder(call) }), {
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

function quest(over: Record<string, unknown> = {}) {
  return {
    questId: "7",
    hatId: "123",
    wearer: WALLET_A,
    creator: WALLET_B,
    submitter: null,
    amount: "2500",
    status: "Open",
    approvalCount: 0,
    attemptCount: 0,
    createdAt: "1700000000",
    submittedAt: null,
    completedAt: null,
    cancelledAt: null,
    metadata: { title: "掃除当番", description: "月曜の朝に" },
    ...over,
  };
}

function discordIdentity(accountId: string, wallet: string) {
  return {
    provider: "discord" as const,
    accountId,
    wallet: wallet as Address,
  };
}

describe("workspace info", () => {
  it("returns the indexed modules and hat ids", async () => {
    const { fetchImpl } = graphStub(() => ({
      workspace: {
        creator: WALLET_A,
        owner: WALLET_B,
        topHatId: "1",
        hatterHatId: "2",
        memberHatId: "3",
        operatorHatId: "4",
        creatorHatId: "5",
        minterHatId: "6",
        questAgentHatId: "7",
        hatsTimeFrameModule: "0xtime",
        hatsHatCreatorModule: "0xcreator",
        hatsQuestModule: "0xquest",
        splitCreator: "0xsplits",
        blockTimestamp: "1700000000",
        thanksToken: { id: "0xthx" },
        hatsFractionTokenModule: { id: "0xfraction" },
      },
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_workspace_info",
      {},
      { identity: identityStub(), fetchImpl },
    );
    const out = JSON.parse(res.text);
    expect(out.treeId).toBe("42");
    expect(out.modules.thanksToken).toBe("0xthx");
    expect(out.modules.hatsFractionTokenModule).toBe("0xfraction");
    expect(out.hats.memberHatId).toBe("3");
    expect(out.createdAt).toBe("2023-11-14T22:13:20.000Z");
  });

  it("says the workspace is not indexed yet instead of failing", async () => {
    const { fetchImpl } = graphStub(() => ({ workspace: null }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_workspace_info",
      {},
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBeUndefined();
    expect(JSON.parse(res.text)).toMatchObject({
      treeId: "42",
      indexed: false,
    });
  });
});

describe("quest reads", () => {
  it("lists quests scoped to the token's workspace", async () => {
    const { fetchImpl, calls } = graphStub(() => ({
      quests: [quest(), quest({ questId: "8", status: "PendingReview" })],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_open_quests",
      { status: ["Open", "PendingReview"], limit: 5 },
      { identity: identityStub(), fetchImpl },
    );
    const out = JSON.parse(res.text);
    expect(out.quests).toHaveLength(2);
    expect(out.quests[0]).toMatchObject({
      questId: "7",
      title: "掃除当番",
      description: "月曜の朝に",
      amountShares: "2500",
      url: "https://toban.xyz/42/quest/7",
    });
    expect(calls[0].variables.where).toEqual({
      workspace: "42",
      status_in: ["Open", "PendingReview"],
    });
    expect(calls[0].variables.first).toBe(5);
  });

  it("rejects a status outside the schema's enum", async () => {
    const { fetchImpl, calls } = graphStub(() => ({ quests: [] }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_open_quests",
      { status: ["Whatever"] },
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("drops the actor's own quests when asked what they may submit", async () => {
    const { fetchImpl } = graphStub((c) =>
      c.endpoint === HATS_ENDPOINT
        ? {
            wearer: {
              currentHats: [{ id: "0x99", tree: { id: "0x0000002a" } }],
            },
          }
        : { quests: [quest({ creator: WALLET_A }), quest({ questId: "9" })] },
    );
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_open_quests",
      { discordUserId: ACTOR },
      {
        identity: identityStub({
          getIdentity: async () => discordIdentity(ACTOR, WALLET_A),
        }),
        fetchImpl,
      },
    );
    const out = JSON.parse(res.text);
    expect(out.member).toBe(true);
    expect(out.quests.map((q: { questId: string }) => q.questId)).toEqual([
      "9",
    ]);
  });

  it("refuses to mix a user with a non-Open status", async () => {
    const { fetchImpl, calls } = graphStub(() => ({ quests: [] }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_open_quests",
      { discordUserId: ACTOR, status: ["Completed"] },
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("returns the review trail for one quest", async () => {
    const { fetchImpl, calls } = graphStub(() => ({
      quests: [
        {
          ...quest({ status: "PendingReview", attemptCount: 2 }),
          metadataUri: "ipfs://bafkrei",
          questModule: "0xquest",
          attempts: [
            {
              attemptIndex: 0,
              submitter: WALLET_A,
              outcome: "Rejected",
              submittedAt: "1700000100",
              withdrawnAt: null,
              rejectedAt: "1700000200",
              approvedAt: null,
              approvals: [],
            },
            {
              attemptIndex: 1,
              submitter: WALLET_A,
              outcome: "Pending",
              submittedAt: "1700000300",
              withdrawnAt: null,
              rejectedAt: null,
              approvedAt: null,
              approvals: [{ approver: WALLET_B, approvedAt: "1700000400" }],
            },
          ],
        },
      ],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_quest_detail",
      { questId: "7" },
      { identity: identityStub(), fetchImpl },
    );
    const out = JSON.parse(res.text);
    expect(out.metadataUri).toBe("ipfs://bafkrei");
    expect(out.attempts).toHaveLength(2);
    expect(out.attempts[0].outcome).toBe("Rejected");
    expect(out.attempts[1].approvals[0].approver).toBe(WALLET_B);
    expect(calls[0].variables.where).toEqual({ workspace: "42", questId: "7" });
  });

  it("reports a quest from another workspace as not found", async () => {
    const { fetchImpl } = graphStub(() => ({ quests: [] }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_quest_detail",
      { questId: "999" },
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBe(true);
  });
});

describe("thanks history", () => {
  const mint = (
    from: string,
    to: string,
    amount: string,
    ts: string,
    data: string,
  ) => ({ from, to, amount, data, blockTimestamp: ts });

  it("merges both directions, newest first, and decodes the message", async () => {
    const { fetchImpl, calls } = graphStub(() => ({
      sent: [
        mint(
          WALLET_A,
          WALLET_B,
          "1000000000000000000",
          "1700000100",
          "0xe38182",
        ),
      ],
      received: [
        mint(WALLET_B, WALLET_A, "2000000000000000000", "1700000200", "0x"),
      ],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_history",
      { discordUserId: ACTOR },
      {
        identity: identityStub({
          getIdentity: async () => discordIdentity(ACTOR, WALLET_A),
          getIdentitiesByWallets: async (_p, wallets) =>
            new Map(
              wallets.map((w) => [
                w.toLowerCase(),
                w.toLowerCase() === WALLET_A ? [discordIdentity(ACTOR, w)] : [],
              ]),
            ),
        }),
        fetchImpl,
      },
    );
    const out = JSON.parse(res.text);
    expect(out.mints.map((m: { amountThx: string }) => m.amountThx)).toEqual([
      "2",
      "1",
    ]);
    expect(out.mints[1].message).toBe("あ");
    expect(out.mints[0].toDiscordUserId).toBe(ACTOR);
    expect(out.mints[0].fromDiscordUserId).toBeNull();
    // Both aliases must carry the workspace scope.
    expect(calls[0].variables.sent).toMatchObject({ workspaceId: "42" });
    expect(calls[0].variables.received).toMatchObject({ workspaceId: "42" });
  });

  it("queries the whole workspace when no user is given", async () => {
    const { fetchImpl, calls } = graphStub(() => ({
      all: [
        mint(WALLET_A, WALLET_B, "1000000000000000000", "1700000100", "0x"),
      ],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_history",
      { sinceDays: 7 },
      { identity: identityStub(), fetchImpl },
    );
    expect(JSON.parse(res.text).mints).toHaveLength(1);
    const where = calls[0].variables.all as Record<string, unknown>;
    expect(where.workspaceId).toBe("42");
    expect(Number(where.blockTimestamp_gte)).toBeGreaterThan(0);
  });

  it("caps the merged list at the requested limit", async () => {
    const rows = (n: number, base: number) =>
      Array.from({ length: n }, (_, i) =>
        mint(WALLET_A, WALLET_B, "1000000000000000000", String(base + i), "0x"),
      );
    const { fetchImpl } = graphStub(() => ({
      sent: rows(3, 1700000000),
      received: rows(3, 1700001000),
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_history",
      { discordUserId: ACTOR, limit: 4 },
      {
        identity: identityStub({
          getIdentity: async () => discordIdentity(ACTOR, WALLET_A),
        }),
        fetchImpl,
      },
    );
    expect(JSON.parse(res.text).mints).toHaveLength(4);
  });

  it("rejects a nonsense sinceDays instead of querying all of history", async () => {
    const { fetchImpl, calls } = graphStub(() => ({ all: [] }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_history",
      { sinceDays: 0 },
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("still returns the mints when the reverse lookup is down", async () => {
    const { fetchImpl } = graphStub(() => ({
      all: [
        mint(WALLET_A, WALLET_B, "1000000000000000000", "1700000100", "0x"),
      ],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_history",
      {},
      {
        identity: identityStub({
          getIdentitiesByWallets: async () => {
            throw new Error("identity worker unreachable");
          },
        }),
        fetchImpl,
      },
    );
    expect(res.isError).toBeUndefined();
    expect(JSON.parse(res.text).mints[0].fromDiscordUserId).toBeNull();
  });
});

describe("members and distributions", () => {
  it("returns role shares with mentionable ids", async () => {
    const { fetchImpl, calls } = graphStub(() => ({
      balanceOfFractionTokens: [
        {
          owner: WALLET_A,
          hatId: "123",
          wearer: WALLET_B,
          balance: "2500",
          updatedAt: "1700000000",
        },
      ],
      escrowedRoleShares: [
        {
          hatId: "123",
          wearer: WALLET_B,
          amount: "500",
          creator: WALLET_A,
          updatedAt: "1700000000",
        },
      ],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_workspace_members",
      {},
      {
        identity: identityStub({
          getIdentitiesByWallets: async (_p, wallets) =>
            new Map(
              wallets.map((w) => [
                w.toLowerCase(),
                [discordIdentity(RECIPIENT, w)],
              ]),
            ),
        }),
        fetchImpl,
      },
    );
    const out = JSON.parse(res.text);
    expect(out.holders[0]).toMatchObject({
      shares: "2500",
      ownerDiscordUserId: RECIPIENT,
    });
    expect(out.escrowed[0].shares).toBe("500");
    expect(calls[0].variables).toMatchObject({ ws: "42", wsStr: "42" });
  });

  it("returns distributor amounts raw, without pretending to know decimals", async () => {
    const { fetchImpl, calls } = graphStub(() => ({
      scheduledDistributors: [
        {
          id: "0xdist",
          scheduler: WALLET_A,
          tokens: ["0xusdc"],
          backupWallet: WALLET_B,
          scheduledDate: "1700000000",
          status: "Pending",
          split: null,
          executedAt: null,
          reclaimedAt: null,
          createdAt: "1699000000",
          tokenBalances: [
            {
              token: "0xusdc",
              totalDeposited: "1000000",
              executedAmount: null,
              reclaimedAmount: null,
            },
          ],
        },
      ],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_reward_distributions",
      { status: ["Pending"] },
      { identity: identityStub(), fetchImpl },
    );
    const out = JSON.parse(res.text);
    expect(out.distributions[0]).toMatchObject({
      address: "0xdist",
      status: "Pending",
      scheduledDate: "2023-11-14T22:13:20.000Z",
    });
    expect(out.distributions[0].balances[0].totalDepositedRaw).toBe("1000000");
    expect(calls[0].variables.where).toEqual({
      workspaceId: "42",
      status_in: ["Pending"],
    });
  });

  it("rejects an unknown distributor status", async () => {
    const { fetchImpl, calls } = graphStub(() => ({}));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_reward_distributions",
      { status: ["Paid"] },
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });
});

describe("thanks message decoding", () => {
  it("round-trips what performThx encodes", () => {
    const hex = `0x${Buffer.from("ありがとう🙏", "utf8").toString("hex")}`;
    expect(decodeThanksMessage(hex)).toBe("ありがとう🙏");
  });

  it("returns empty for absent or unparseable bytes", () => {
    expect(decodeThanksMessage("0x")).toBe("");
    expect(decodeThanksMessage(null)).toBe("");
  });

  it("strips control characters from attacker-supplied bytes", () => {
    const hex = `0x${Buffer.from("a\u0007b", "utf8").toString("hex")}`;
    expect(decodeThanksMessage(hex)).toBe("ab");
  });
});

describe("unit annotations", () => {
  it("labels quest rewards as shares, not THX", async () => {
    const { fetchImpl } = graphStub(() => ({ quests: [quest()] }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_open_quests",
      {},
      { identity: identityStub(), fetchImpl },
    );
    const out = JSON.parse(res.text);
    expect(out.units.fields).toEqual({ amountShares: "shares" });
    expect(out.units.notes.shares).toContain("10000");
    // The THX note must not ride along on a response that carries no THX.
    expect(out.units.notes.thx).toBeUndefined();
  });

  it("labels distributor amounts as raw and says they are unconverted", async () => {
    const { fetchImpl } = graphStub(() => ({
      scheduledDistributors: [
        {
          id: "0xdist",
          scheduler: WALLET_A,
          tokens: ["0xusdc"],
          backupWallet: WALLET_B,
          scheduledDate: "1700000000",
          status: "Pending",
          split: null,
          executedAt: null,
          reclaimedAt: null,
          createdAt: "1699000000",
          tokenBalances: [
            {
              token: "0xusdc",
              totalDeposited: "1000000",
              executedAmount: null,
              reclaimedAmount: null,
            },
          ],
        },
      ],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_reward_distributions",
      {},
      { identity: identityStub(), fetchImpl },
    );
    const out = JSON.parse(res.text);
    expect(out.units.fields.totalDepositedRaw).toBe("raw");
    expect(out.units.notes.raw).toContain("decimals");
  });

  it("labels every amount it returns", async () => {
    const { fetchImpl } = graphStub(() => ({
      all: [
        {
          from: WALLET_A,
          to: WALLET_B,
          amount: "1000000000000000000",
          data: "0x",
          blockTimestamp: "1700000100",
        },
      ],
    }));
    const res = await callTool(
      fakeEnv(),
      GUILD,
      "toban_thx_history",
      {},
      { identity: identityStub(), fetchImpl },
    );
    const out = JSON.parse(res.text);
    // Every amount-shaped key in the payload must appear in units.fields.
    const amountKeys = Object.keys(out.mints[0]).filter((k) =>
      /Thx$|Shares$|Raw$/.test(k),
    );
    expect(amountKeys).not.toHaveLength(0);
    for (const key of amountKeys) {
      expect(out.units.fields[key]).toBeDefined();
    }
  });

  it("carries a note for each unit it uses, and no others", () => {
    const block = unitsFor({ a: "thx", b: "shares", c: "thx" });
    expect(Object.keys(block.notes).sort()).toEqual(["shares", "thx"]);
    expect(block.notes.raw).toBeUndefined();
  });
});
