import type { Address } from "viem";
import { describe, expect, it } from "vitest";
import { type TokenLookup, authenticate, issueToken } from "../src/auth";
import type { Env } from "../src/env";
import type { IdentityClient } from "../src/identity";
import { handleRpc } from "../src/protocol";
import { decodeThanksMessage, unitsFor } from "../src/queries";
import type { AuthContext } from "../src/tools";
import { TOOL_DEFINITIONS, callTool } from "../src/tools";

const TREE_ID = "42";
const OTHER_TREE_ID = "99";
const TOKEN_ID = "tok_abc123";
const CHANNEL = "333333333333333333";
const ACTOR = "444444444444444444";
const RECIPIENT = "555555555555555555";
const SECRET = "test-secret";

function fakeEnv(): Env {
  return {
    DB: {} as unknown as D1Database,
    IDENTITY: {} as unknown as Fetcher,
    CONFIRM: {} as unknown as Fetcher,
    GOLDSKY_GRAPHQL_ENDPOINT: "https://goldsky.example.invalid/graphql",
    HATS_GRAPHQL_ENDPOINT: "https://hats.example.invalid/graphql",
    TOBAN_FRONTEND_URL: "https://toban.xyz",
    RPC_URL: "https://example.invalid",
    CHAIN_ID: "8453",
    TURNKEY_BOT_SIGNER_ADDRESS: `0x${"bb".repeat(20)}`,
    MCP_TOKEN_SECRET: SECRET,
    LOOKUP_READ_SECRET: "lookup-secret",
    MCP_INTERNAL_PROPOSE_SECRET: "propose-secret",
  };
}

const auth: AuthContext = { ok: true, treeId: TREE_ID, tokenId: TOKEN_ID };

const identityStub = (over: Partial<IdentityClient> = {}): IdentityClient => ({
  getIdentity: async () => null,
  getIdentitiesByWallets: async (_provider, wallets) =>
    new Map(wallets.map((w) => [w.toLowerCase(), []])),
  ...over,
});

// ---------------------------------------------------------------- auth

describe("tbn2 bearer tokens", () => {
  const lookupOk: TokenLookup = async (tokenId) =>
    tokenId === TOKEN_ID ? { treeId: TREE_ID, revoked: false } : null;

  it("round-trips and reports the token's home treeId", async () => {
    const token = await issueToken(SECRET, TREE_ID, TOKEN_ID);
    expect(token.startsWith("tbn2.")).toBe(true);
    const res = await authenticate(SECRET, `Bearer ${token}`, lookupOk);
    expect(res).toEqual({ ok: true, treeId: TREE_ID, tokenId: TOKEN_ID });
  });

  it("rejects a token minted with a different secret", async () => {
    const token = await issueToken("other-secret", TREE_ID, TOKEN_ID);
    const res = await authenticate(SECRET, `Bearer ${token}`, lookupOk);
    expect(res.ok).toBe(false);
  });

  it("rejects a token whose treeId was swapped", async () => {
    const token = await issueToken(SECRET, TREE_ID, TOKEN_ID);
    const [prefix, , tokenId, mac] = token.split(".");
    const forged = [prefix, OTHER_TREE_ID, tokenId, mac].join(".");
    const res = await authenticate(SECRET, `Bearer ${forged}`, lookupOk);
    expect(res.ok).toBe(false);
  });

  it("fails closed when the secret is unset", async () => {
    const res = await authenticate(undefined, "Bearer whatever", lookupOk);
    expect(res).toMatchObject({ ok: false, status: 500 });
  });

  it("rejects a missing or malformed header", async () => {
    expect((await authenticate(SECRET, null, lookupOk)).ok).toBe(false);
    expect((await authenticate(SECRET, "Bearer nope", lookupOk)).ok).toBe(
      false,
    );
  });

  it("rejects a stale tbn1 token as malformed, not as a tree-42 token", async () => {
    // The old format: tbn1.<guildId>.<mac>. Even a guildId that happens to
    // look like a treeId must not be reinterpreted — see auth.ts's module
    // doc for why the MAC message prefix changed, not just the token prefix.
    const legacyLikeToken = `tbn1.${TREE_ID}.deadbeefdeadbeefdeadbe`;
    const res = await authenticate(
      SECRET,
      `Bearer ${legacyLikeToken}`,
      lookupOk,
    );
    expect(res).toMatchObject({
      ok: false,
      status: 401,
      message: "malformed token",
    });
  });

  it("rejects a token whose registry row has been revoked", async () => {
    const token = await issueToken(SECRET, TREE_ID, TOKEN_ID);
    const lookupRevoked: TokenLookup = async () => ({
      treeId: TREE_ID,
      revoked: true,
    });
    const res = await authenticate(SECRET, `Bearer ${token}`, lookupRevoked);
    expect(res).toMatchObject({
      ok: false,
      status: 401,
      message: "revoked token",
    });
  });

  it("rejects a token whose tokenId is not in the registry at all", async () => {
    const token = await issueToken(SECRET, TREE_ID, "some-other-id");
    const lookupMiss: TokenLookup = async () => null;
    const res = await authenticate(SECRET, `Bearer ${token}`, lookupMiss);
    expect(res.ok).toBe(false);
  });

  it("never reaches the registry lookup for a MAC that fails stage 1", async () => {
    let lookupCalls = 0;
    const countingLookup: TokenLookup = async () => {
      lookupCalls++;
      return { treeId: TREE_ID, revoked: false };
    };
    await authenticate(SECRET, "Bearer tbn2.42.x.garbage-mac", countingLookup);
    expect(lookupCalls).toBe(0);
  });
});

// ------------------------------------------------------------ protocol

describe("MCP protocol", () => {
  const deps = {
    serverName: "toban",
    serverVersion: "0.2.0",
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

  it("lists tools, including workspace_info with no args", async () => {
    const res = (await handleRpc(
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
      deps,
    )) as { result: { tools: { name: string }[] } };
    expect(res.result.tools.map((t) => t.name)).toContain(
      "toban_workspace_info",
    );
  });

  it("returns a tool refusal as a successful result with isError", async () => {
    const res = (await handleRpc(
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "boom" } },
      deps,
    )) as { result: { isError: boolean } };
    expect(res.result.isError).toBe(true);
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
  return { provider: "discord" as const, accountId, wallet: wallet as Address };
}

describe("workspace info", () => {
  it("returns the home workspace unconditionally (no treeId arg exists)", async () => {
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
      auth,
      "toban_workspace_info",
      {},
      { identity: identityStub(), fetchImpl },
    );
    const out = JSON.parse(res.text);
    expect(out.treeId).toBe(TREE_ID);
    expect(out.modules.thanksToken).toBe("0xthx");
    expect(out.hats.memberHatId).toBe("3");
  });

  it("says the workspace is not indexed yet instead of failing", async () => {
    const { fetchImpl } = graphStub(() => ({ workspace: null }));
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_workspace_info",
      {},
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBeUndefined();
    expect(JSON.parse(res.text)).toMatchObject({
      treeId: TREE_ID,
      indexed: false,
    });
  });
});

describe("cross-workspace reads (§6)", () => {
  it("allows reading another workspace's quest list", async () => {
    const { fetchImpl, calls } = graphStub(() => ({ quests: [quest()] }));
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_open_quests",
      { treeId: OTHER_TREE_ID },
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBeUndefined();
    expect(JSON.parse(res.text).quests).toHaveLength(1);
    expect(calls[0].variables.where).toMatchObject({
      workspace: OTHER_TREE_ID,
    });
  });

  it("refuses discordUserId resolution once treeId points at another workspace", async () => {
    const { fetchImpl, calls } = graphStub(() => ({ quests: [] }));
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_open_quests",
      { treeId: OTHER_TREE_ID, discordUserId: ACTOR },
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("member_status always refuses discordUserId for a non-home treeId", async () => {
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_member_status",
      { treeId: OTHER_TREE_ID, discordUserId: ACTOR },
      { identity: identityStub() },
    );
    expect(res.isError).toBe(true);
    expect(res.text).toContain("discordUserId は解決できません");
  });

  it("thx_history refuses discordUserId for a non-home treeId", async () => {
    const { fetchImpl, calls } = graphStub(() => ({ all: [] }));
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_thx_history",
      { treeId: OTHER_TREE_ID, discordUserId: ACTOR },
      { identity: identityStub(), fetchImpl },
    );
    expect(res.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("thx_history for another workspace returns mints but never resolves Discord ids", async () => {
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
    let reverseLookupCalled = false;
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_thx_history",
      { treeId: OTHER_TREE_ID },
      {
        identity: identityStub({
          getIdentitiesByWallets: async (_p, wallets) => {
            reverseLookupCalled = true;
            return new Map(wallets.map((w) => [w.toLowerCase(), []]));
          },
        }),
        fetchImpl,
      },
    );
    expect(res.isError).toBeUndefined();
    const out = JSON.parse(res.text);
    expect(out.mints).toHaveLength(1);
    expect(out.mints[0].fromDiscordUserId).toBeNull();
    expect(out.mints[0].toDiscordUserId).toBeNull();
    expect(reverseLookupCalled).toBe(false);
  });

  it("workspace_members for another workspace skips reverse lookup", async () => {
    const { fetchImpl } = graphStub(() => ({
      balanceOfFractionTokens: [
        {
          owner: WALLET_A,
          hatId: "123",
          wearer: WALLET_B,
          balance: "2500",
          updatedAt: "1700000000",
        },
      ],
      escrowedRoleShares: [],
    }));
    let reverseLookupCalled = false;
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_workspace_members",
      { treeId: OTHER_TREE_ID },
      {
        identity: identityStub({
          getIdentitiesByWallets: async (_p, wallets) => {
            reverseLookupCalled = true;
            return new Map(wallets.map((w) => [w.toLowerCase(), []]));
          },
        }),
        fetchImpl,
      },
    );
    expect(res.isError).toBeUndefined();
    expect(JSON.parse(res.text).holders[0].ownerDiscordUserId).toBeNull();
    expect(reverseLookupCalled).toBe(false);
  });

  it("still resolves Discord ids when reading the home workspace", async () => {
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
      auth,
      "toban_thx_history",
      {},
      {
        identity: identityStub({
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
    expect(out.mints[0].fromDiscordUserId).toBe(ACTOR);
  });

  it("rejects a malformed treeId argument", async () => {
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_quest_detail",
      { treeId: "not-a-number", questId: "1" },
      { identity: identityStub() },
    );
    expect(res.isError).toBe(true);
  });
});

describe("thanks message decoding", () => {
  it("round-trips arbitrary UTF-8, including multibyte characters", () => {
    const hex = `0x${Buffer.from("ありがとう🙏", "utf8").toString("hex")}`;
    expect(decodeThanksMessage(hex)).toBe("ありがとう🙏");
  });

  it("returns empty for absent or unparseable bytes", () => {
    expect(decodeThanksMessage("0x")).toBe("");
    expect(decodeThanksMessage(null)).toBe("");
  });

  it("strips control characters from attacker-supplied bytes", () => {
    const hex = `0x${Buffer.from("ab", "utf8").toString("hex")}`;
    expect(decodeThanksMessage(hex)).toBe("ab");
  });
});

describe("unit annotations", () => {
  it("carries a note for each unit it uses, and no others", () => {
    const block = unitsFor({ a: "thx", b: "shares", c: "thx" });
    expect(Object.keys(block.notes).sort()).toEqual(["shares", "thx"]);
    expect(block.notes.raw).toBeUndefined();
  });
});

// -------------------------------------------------------------- propose

describe("propose tools (forward to discord-bot over CONFIRM)", () => {
  function proposeFetchStub(
    responder: (url: string, init: RequestInit) => unknown,
  ): typeof fetch {
    return (async (url: string, init: RequestInit) =>
      new Response(JSON.stringify(responder(url, init)), {
        headers: { "content-type": "application/json" },
      })) as unknown as typeof fetch;
  }

  it("packages a thx proposal as an InternalProposeRequest scoped to home", async () => {
    let sent: Record<string, unknown> | null = null;
    const proposeFetch = proposeFetchStub((_url, init) => {
      sent = JSON.parse(String(init.body));
      return { ok: true, messageId: "m1" };
    });
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_thx_propose",
      {
        channelId: CHANNEL,
        forDiscordUserId: ACTOR,
        toDiscordUserId: RECIPIENT,
        amount: 5,
        message: "助かりました",
      },
      { proposeFetch },
    );
    expect(res.isError).toBeUndefined();
    expect(res.text).toContain("まだ何も送られていません");
    expect(sent).toMatchObject({
      kind: "thx",
      treeId: TREE_ID,
      channelId: CHANNEL,
      forDiscordUserId: ACTOR,
      toDiscordUserId: RECIPIENT,
      amount: 5,
    });
  });

  it("relays a discord-bot refusal (e.g. reversed workspace check) as a tool failure", async () => {
    const proposeFetch = proposeFetchStub(() => ({
      ok: false,
      error: "指定されたチャンネルはこのワークスペースのものではありません。",
    }));
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_thx_propose",
      {
        channelId: CHANNEL,
        forDiscordUserId: ACTOR,
        toDiscordUserId: RECIPIENT,
        amount: 5,
      },
      { proposeFetch },
    );
    expect(res.isError).toBe(true);
    expect(res.text).toContain("ワークスペースのものではありません");
  });

  it("rejects a non-positive amount before ever forwarding", async () => {
    let called = false;
    const proposeFetch = proposeFetchStub(() => {
      called = true;
      return { ok: true, messageId: "m1" };
    });
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_thx_propose",
      {
        channelId: CHANNEL,
        forDiscordUserId: ACTOR,
        toDiscordUserId: RECIPIENT,
        amount: 0,
      },
      { proposeFetch },
    );
    expect(res.isError).toBe(true);
    expect(called).toBe(false);
  });

  it("forwards a quest-submit proposal", async () => {
    let sent: Record<string, unknown> | null = null;
    const proposeFetch = proposeFetchStub((_url, init) => {
      sent = JSON.parse(String(init.body));
      return { ok: true, messageId: "m2" };
    });
    const res = await callTool(
      fakeEnv(),
      auth,
      "toban_quest_submit_propose",
      { channelId: CHANNEL, forDiscordUserId: ACTOR, questId: "7" },
      { proposeFetch },
    );
    expect(res.isError).toBeUndefined();
    expect(sent).toMatchObject({
      kind: "quest",
      treeId: TREE_ID,
      questId: "7",
    });
  });

  it("has no treeId argument in its schema — a propose tool cannot target another workspace", () => {
    const thxTool = TOOL_DEFINITIONS.find(
      (t) => t.name === "toban_thx_propose",
    );
    const props = (
      thxTool?.inputSchema as { properties: Record<string, unknown> }
    ).properties;
    expect(props.treeId).toBeUndefined();
  });
});
