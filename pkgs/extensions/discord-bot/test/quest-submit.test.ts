import type {
  APIApplicationCommandAutocompleteInteraction,
  APIChatInputApplicationCommandInteraction,
} from "discord-api-types/v10";
import type { Address, Hex } from "viem";
import { describe, expect, it } from "vitest";
import type { SubmittableQuest } from "../src/chain";
import {
  buildQuestChoices,
  describeSubmitRevert,
  executeQuestSubmit,
  handleQuestAutocomplete,
  parseQuestSubmitArgs,
  questChoiceLabel,
} from "../src/commands/quest-submit";
import type { Env } from "../src/env";
import type {
  IdentityClient,
  IdentityRecord,
  PlatformLink,
} from "../src/identity";

const TEST_TREE_ID = "3002";
const TEST_GUILD_ID = "g123";

const fakePlatformLink: PlatformLink = {
  provider: "discord",
  platformId: TEST_GUILD_ID,
  treeId: TEST_TREE_ID,
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
  };
}

class StubIdentity implements IdentityClient {
  constructor(
    private readonly records: Record<string, IdentityRecord>,
    private readonly link: PlatformLink | null = fakePlatformLink,
  ) {}
  async getIdentity(_p: "discord", accountId: string) {
    return this.records[accountId] ?? null;
  }
  async getIdentitiesByWallet(_p: "discord", wallet: string) {
    return Object.values(this.records).filter(
      (r) => r.wallet.toLowerCase() === wallet.toLowerCase(),
    );
  }
  async getIdentitiesByWallets(
    p: "discord",
    wallets: readonly string[],
  ): Promise<Map<string, IdentityRecord[]>> {
    const out = new Map<string, IdentityRecord[]>();
    for (const w of wallets) {
      out.set(w.toLowerCase(), await this.getIdentitiesByWallet(p, w));
    }
    return out;
  }
  async getPlatformLink() {
    return this.link;
  }
  async upsertPlatformLink() {
    /* no-op */
  }
  async claimInstallStateJti() {
    return { ok: true } as const;
  }
}

function autocompleteInteraction(
  actorSf: string,
  query: string,
): APIApplicationCommandAutocompleteInteraction {
  return {
    application_id: "appid",
    id: "i1",
    token: "tok",
    type: 4,
    version: 1,
    guild_id: TEST_GUILD_ID,
    member: {
      user: {
        id: actorSf,
        username: actorSf,
        discriminator: "0001",
        avatar: null,
        global_name: null,
      },
      roles: [],
      joined_at: "",
      deaf: false,
      mute: false,
      flags: 0,
      permissions: "0",
    },
    data: {
      id: "cmdid",
      name: "quest",
      type: 1,
      options: [
        {
          name: "submit",
          type: 1, // SUB_COMMAND
          options: [{ name: "quest", type: 3, value: query, focused: true }],
        },
      ],
    },
  } as unknown as APIApplicationCommandAutocompleteInteraction;
}

function commandInteraction(
  actorSf: string,
  questIdValue: string,
): APIChatInputApplicationCommandInteraction {
  return {
    application_id: "appid",
    id: "i1",
    token: "tok",
    type: 2,
    version: 1,
    guild_id: TEST_GUILD_ID,
    member: {
      user: {
        id: actorSf,
        username: actorSf,
        discriminator: "0001",
        avatar: null,
        global_name: null,
      },
      roles: [],
      joined_at: "",
      deaf: false,
      mute: false,
      flags: 0,
      permissions: "0",
    },
    data: {
      id: "cmdid",
      name: "quest",
      type: 1,
      options: [
        {
          name: "submit",
          type: 1,
          options: [{ name: "quest", type: 3, value: questIdValue }],
        },
      ],
    },
  } as unknown as APIChatInputApplicationCommandInteraction;
}

const actor: IdentityRecord = {
  provider: "discord",
  accountId: "100",
  wallet: `0x${"aa".repeat(20)}` as Address,
};

describe("questChoiceLabel", () => {
  it("uses the title alone when present", () => {
    expect(questChoiceLabel({ questId: 42n, title: "Design" })).toBe("Design");
  });

  it("falls back to the bare id when untitled", () => {
    expect(questChoiceLabel({ questId: 7n, title: null })).toBe("クエスト #7");
  });

  it("clamps to 100 chars", () => {
    const label = questChoiceLabel({ questId: 1n, title: "x".repeat(200) });
    expect(Array.from(label).length).toBe(100);
    expect(label.endsWith("…")).toBe(true);
  });

  it("truncates on a code-point boundary without splitting a surrogate pair", () => {
    // 🎉 is a 2-code-unit astral char. Pack the title so the 99th code point
    // falls on an emoji, which a UTF-16 slice would split into a lone surrogate.
    const title = `${"a".repeat(98)}${"🎉".repeat(10)}`;
    const label = questChoiceLabel({ questId: 1n, title });
    // No unpaired surrogate: re-encoding round-trips cleanly.
    for (const ch of label) {
      const code = ch.codePointAt(0) as number;
      expect(code >= 0xd800 && code <= 0xdfff).toBe(false);
    }
    expect(label.endsWith("…")).toBe(true);
  });
});

describe("describeSubmitRevert", () => {
  it("translates NotWorkspaceMember into an actionable message", () => {
    expect(describeSubmitRevert("... NotWorkspaceMember()")).toContain(
      "メンバーシップをオンチェーンで確認できませんでした",
    );
  });

  it("translates InvalidStatus into a 'cannot submit' message", () => {
    expect(describeSubmitRevert("reverted: InvalidStatus()")).toContain(
      "このクエストは完了報告できません",
    );
  });

  it("passes through unrecognised reverts verbatim", () => {
    expect(describeSubmitRevert("some other error")).toBe(
      "submitCompletion に失敗しました: some other error",
    );
  });
});

describe("buildQuestChoices", () => {
  const quests: SubmittableQuest[] = [
    { questId: 1n, title: "Design work" },
    { questId: 2n, title: "Write docs" },
    { questId: 3n, title: null },
  ];

  it("returns all quests (mapped to id values) on empty query", () => {
    const choices = buildQuestChoices(quests, "");
    expect(choices).toHaveLength(3);
    expect(choices[0]).toEqual({ name: "Design work", value: "1" });
  });

  it("filters by title substring, case-insensitively", () => {
    const choices = buildQuestChoices(quests, "docs");
    expect(choices).toHaveLength(1);
    expect(choices[0].value).toBe("2");
  });

  it("filters by quest id substring", () => {
    const choices = buildQuestChoices(quests, "3");
    expect(choices.map((c) => c.value)).toEqual(["3"]);
  });

  it("caps at 25 choices", () => {
    const many: SubmittableQuest[] = Array.from({ length: 40 }, (_, i) => ({
      questId: BigInt(i),
      title: `Quest ${i}`,
    }));
    expect(buildQuestChoices(many, "")).toHaveLength(25);
  });
});

describe("parseQuestSubmitArgs", () => {
  it("extracts the quest id", () => {
    const out = parseQuestSubmitArgs(commandInteraction("100", "42"));
    expect("error" in out).toBe(false);
    if ("error" in out) return;
    expect(out.questId).toBe(42n);
  });

  it("errors on a non-numeric quest value", () => {
    const out = parseQuestSubmitArgs(commandInteraction("100", "abc"));
    expect("error" in out).toBe(true);
  });
});

describe("handleQuestAutocomplete", () => {
  it("returns empty choices when the actor isn't linked", async () => {
    const res = await handleQuestAutocomplete(
      fakeEnv(),
      autocompleteInteraction("100", ""),
      {
        identity: new StubIdentity({}),
        resolveMembershipHatId: async () => 1n,
        resolveSubmittableQuests: async () => [{ questId: 1n, title: "x" }],
      },
    );
    expect(res).toEqual({ type: 8, data: { choices: [] } });
  });

  it("returns empty choices when the actor is not a workspace member", async () => {
    const res = await handleQuestAutocomplete(
      fakeEnv(),
      autocompleteInteraction("100", ""),
      {
        identity: new StubIdentity({ "100": actor }),
        resolveMembershipHatId: async () => null,
        resolveSubmittableQuests: async () => [{ questId: 1n, title: "x" }],
      },
    );
    expect(res.data.choices).toHaveLength(0);
  });

  it("lists submittable quests filtered by the focused input", async () => {
    const res = await handleQuestAutocomplete(
      fakeEnv(),
      autocompleteInteraction("100", "design"),
      {
        identity: new StubIdentity({ "100": actor }),
        resolveMembershipHatId: async () => 5n,
        resolveSubmittableQuests: async () => [
          { questId: 1n, title: "Design work" },
          { questId: 2n, title: "Docs" },
        ],
      },
    );
    expect(res.data.choices).toEqual([{ name: "Design work", value: "1" }]);
  });
});

describe("executeQuestSubmit", () => {
  it("messages the user if their account isn't linked", async () => {
    const messages: string[] = [];
    await executeQuestSubmit(fakeEnv(), commandInteraction("100", "1"), {
      identity: new StubIdentity({}),
      followup: async (_a, _t, c) => {
        messages.push(c);
      },
    });
    expect(messages[0]).toContain("ウォレットが連携されていません");
  });

  it("messages the user if they aren't a workspace member", async () => {
    const messages: string[] = [];
    await executeQuestSubmit(fakeEnv(), commandInteraction("100", "1"), {
      identity: new StubIdentity({ "100": actor }),
      resolveMembershipHatId: async () => null,
      resolveQuestModule: async () => `0x${"22".repeat(20)}` as Hex,
      followup: async (_a, _t, c) => {
        messages.push(c);
      },
    });
    expect(messages[0]).toContain("このワークスペースのメンバーではないため");
  });

  it("messages the user if the quest module can't be resolved", async () => {
    const messages: string[] = [];
    await executeQuestSubmit(fakeEnv(), commandInteraction("100", "1"), {
      identity: new StubIdentity({ "100": actor }),
      resolveMembershipHatId: async () => 5n,
      resolveQuestModule: async () => null,
      followup: async (_a, _t, c) => {
        messages.push(c);
      },
    });
    expect(messages[0]).toContain("クエストモジュールを取得できませんでした");
  });
});
