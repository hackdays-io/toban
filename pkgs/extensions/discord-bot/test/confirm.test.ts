/**
 * Tests for what's left of `src/confirm/` (formerly `src/mcp/`) in this
 * package after the MCP extraction (`docs/mcp-extraction.md`): `confirm.ts`
 * and `button.ts`.
 *
 * Everything else that used to be tested here (guild-scoped token auth, the
 * JSON-RPC protocol layer, the tool surface, the Goldsky read queries) moved
 * to `@toban/mcp` — see that package's `test/mcp.test.ts`. The propose-tool
 * request/response contract that used to live in `tools.ts`'s `proposeTool`
 * is now `src/internal/propose.ts`'s `handleInternalPropose`, tested in
 * `test/internal-propose.test.ts`.
 */
import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import type { Address, Hex } from "viem";
import { describe, expect, it, vi } from "vitest";
import {
  handleConfirmButton,
  isConfirmComponent,
  readPayload,
} from "../src/confirm/button";
import {
  CANCEL_CUSTOM_ID,
  CONFIRM_CUSTOM_ID,
  buildConfirmMessage,
  decodePayload,
  encodePayload,
} from "../src/confirm/confirm";
import type { DiscordRest } from "../src/confirm/discord-rest";
import type { Env } from "../src/env";

const GUILD = "111111111111111111";
const OTHER_GUILD = "222222222222222222";
const CHANNEL = "333333333333333333";
const ACTOR = "444444444444444444";
const RECIPIENT = "555555555555555555";

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
    MCP_INTERNAL_PROPOSE_SECRET: "propose-secret",
  };
}

function restStub(over: Partial<DiscordRest> = {}): DiscordRest {
  return {
    getChannelGuildId: async () => GUILD,
    postMessage: async () => ({ id: "m1" }),
    editMessage: async () => {},
    ...over,
  };
}

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

// ------------------------------------------------------------- button

function fakeCtx(): ExecutionContext {
  const pending: Promise<unknown>[] = [];
  return {
    waitUntil: (p: Promise<unknown>) => pending.push(p),
    passThroughOnException: () => {},
    props: {},
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
