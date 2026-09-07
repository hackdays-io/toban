/**
 * Toban's MCP tool surface.
 *
 * Moved from `@toban/discord-bot`'s `src/mcp/tools.ts`
 * (`docs/mcp-extraction.md` §3, §8), with two structural changes:
 *
 * - **The token pins a `treeId`, not a `guildId`.** There is no more
 *   "is this guild linked to a workspace" check — the workspace is the
 *   credential's home, full stop. Read tools may still accept an explicit
 *   `treeId` argument to look at *another* workspace (§6): reads are
 *   boundary-as-default, not boundary-as-wall, because the underlying data
 *   is subgraph-public anyway.
 * - **Proposals never touch Discord directly.** `toban_thx_propose` /
 *   `toban_quest_submit_propose` build an `InternalProposeRequest` and call
 *   `env.CONFIRM` (the service binding to `@toban/discord-bot`'s
 *   `POST /internal/propose`) instead of posting a Discord message
 *   themselves. This package holds no Discord bot token and never will —
 *   see CLAUDE.md's invariants.
 *
 * Two kinds of tool, and the split still matters:
 *
 * - **Reads** answer about a workspace (home, by default). They are safe to
 *   expose to an agent we do not run, because the chain/subgraph data is
 *   already public.
 * - **Proposals** never touch the chain. They ask discord-bot to post a
 *   confirm message and stop. Signing happens later, from the button click
 *   inside discord-bot — see that package's `src/internal/propose.ts` and
 *   `src/mcp/button.ts`.
 *
 * Every tool takes a Discord user id for *whom* it is acting where relevant.
 * That id is only ever used to look something up or to decide who may press
 * a button. It can never authorise an action, so an agent getting it wrong
 * (or lying) cannot move value.
 */
import type {
  InternalProposeRequest,
  InternalProposeResponse,
} from "@toban/discord-bot/internal-propose";
import {
  type Address,
  type Hex,
  formatEther,
  isAddress,
  parseEther,
} from "viem";
import type { AuthResult } from "./auth.js";
import {
  THANKS_TOKEN_ABI,
  getPublicClient,
  resolveMembershipHatId,
  resolveRelatedRoles,
  resolveThanksTokenAddress,
} from "./chain.js";
import type { Env } from "./env.js";
import {
  type IdentityClient,
  type IdentityRecord,
  createIdentityClient,
} from "./identity.js";
import type { ToolDefinition, ToolResult } from "./protocol.js";
import {
  DISTRIBUTOR_STATUSES,
  type DistributorStatus,
  MAX_LIMIT,
  QUEST_STATUSES,
  type QuestStatus,
  clampLimit,
  resolveQuestDetail,
  resolveQuests,
  resolveRewardDistributions,
  resolveThanksHistory,
  resolveThanksTotals,
  resolveWorkspaceOverview,
  resolveWorkspaceRoles,
  unitsFor,
} from "./queries.js";

/** Home treeId + tokenId, as returned by `authenticate()` in `auth.ts`. */
export type AuthContext = Extract<AuthResult, { ok: true }>;

export interface McpToolDeps {
  identity?: IdentityClient;
  /** Injected in tests so subgraph reads never hit the network. */
  fetchImpl?: typeof fetch;
  /**
   * Injected in tests to stand in for `env.CONFIRM.fetch`, so a propose test
   * never needs a real service binding.
   */
  proposeFetch?: typeof fetch;
  resolveTokenAddress?: (treeId: string) => Promise<Hex | null>;
}

const snowflake = { type: "string", pattern: "^\\d+$" } as const;
const treeIdArg = {
  type: "string",
  pattern: "^\\d+$",
  description:
    "対象のワークスペース（tree id）。省略するとトークンの home ワークスペース。",
} as const;

/** Appended to a tool's description when it resolves Discord user ids. */
const CROSS_WORKSPACE_IDENTITY_NOTE =
  "他のワークスペースを指定した場合、Discord ユーザー ID は解決されずアドレスのみ返る。";

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "toban_workspace_info",
    description:
      "このトークンの home ワークスペース（tree id・チェーン・URL）を返す。まずこれを呼んで、自分がどのワークスペースの担当か確かめる。",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "toban_member_status",
    description: `指定した Discord ユーザーのウォレット連携状況、サンクストークンの残高／送付累計、および送信可能枠を返す。送付を提案する前に枠が足りるか確認するのに使う。受け取った量(thxBalance)と、これから送れる枠(mintableThx / botAllowanceThx)は別物なので取り違えないこと。応答の \`units\` に各数量の単位が入る。合計・比較・割合を出す前に必ず読み、単位の違う値を混ぜないこと。${CROSS_WORKSPACE_IDENTITY_NOTE}`,
    inputSchema: {
      type: "object",
      properties: {
        treeId: treeIdArg,
        discordUserId: {
          ...snowflake,
          description: "対象の Discord ユーザー ID",
        },
      },
      required: ["discordUserId"],
      additionalProperties: false,
    },
  },
  {
    name: "toban_open_quests",
    description: `ワークスペースのクエスト一覧を返す(報酬シェア数・ステータス・説明・承認数つき)。既定では Open のものだけ。discordUserId を渡すと『その人が完了報告できるもの』に絞る(本人が作成したクエストは除外される)ため、その場合 status は Open のみ。個別のクエストの経緯(提出履歴・承認者)は toban_quest_detail を使う。応答の \`units\` に各数量の単位が入る。合計・比較・割合を出す前に必ず読み、単位の違う値を混ぜないこと。${CROSS_WORKSPACE_IDENTITY_NOTE}`,
    inputSchema: {
      type: "object",
      properties: {
        treeId: treeIdArg,
        discordUserId: {
          ...snowflake,
          description:
            "指定すると、この人が完了報告できる Open クエストだけに絞る(任意。home 以外のワークスペースでは指定できない)",
        },
        status: {
          type: "array",
          items: { type: "string", enum: [...QUEST_STATUSES] },
          description:
            '絞り込むステータス。既定は ["Open"]。レビュー待ちは PendingReview',
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_LIMIT,
          description: `返す最大件数(既定 20、上限 ${MAX_LIMIT})`,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "toban_quest_detail",
    description:
      "クエスト 1 件の詳細を返す。説明文・報酬シェア数・IPFS メタデータ URI に加えて、" +
      "提出の試行履歴(誰がいつ出して、取り下げ／却下／承認されたか)と承認者の一覧を含む。" +
      "応答の `units` に各数量の単位が入る。合計・比較・割合を出す前に必ず読み、単位の違う値を混ぜないこと。",
    inputSchema: {
      type: "object",
      properties: {
        treeId: treeIdArg,
        questId: {
          type: "string",
          pattern: "^\\d+$",
          description: "クエスト ID(10 進数の文字列)",
        },
      },
      required: ["questId"],
      additionalProperties: false,
    },
  },
  {
    name: "toban_thx_history",
    description: `サンクストークンの送付履歴(新しい順)を返す。添えられたメッセージも復元する。discordUserId を省くとワークスペース全体の履歴。誰が誰に贈ったかを振り返ったり、月次のまとめを作るのに使う。**これは読み取りだけで、何も送らない。**応答の \`units\` に各数量の単位が入る。合計・比較・割合を出す前に必ず読み、単位の違う値を混ぜないこと。${CROSS_WORKSPACE_IDENTITY_NOTE}`,
    inputSchema: {
      type: "object",
      properties: {
        treeId: treeIdArg,
        discordUserId: {
          ...snowflake,
          description:
            "この人に関わる送付だけに絞る(任意。home 以外のワークスペースでは指定できない)",
        },
        direction: {
          type: "string",
          enum: ["sent", "received", "any"],
          description:
            "discordUserId を指定したときの向き。既定は any(送受信の両方)",
        },
        sinceDays: {
          type: "integer",
          minimum: 1,
          maximum: 365,
          description: "何日前までを対象にするか(任意、既定は全期間)",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_LIMIT,
          description: `返す最大件数(既定 20、上限 ${MAX_LIMIT})`,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "toban_workspace_members",
    description: `ワークスペースのロールシェア保有状況を返す。誰がどのロール(hatId)のシェアをいくつ持っているか、および未受け取り(エスクロー中)のシェア。連携済みのウォレットには Discord ユーザー ID が付くのでメンションに使える。応答の \`units\` に各数量の単位が入る。合計・比較・割合を出す前に必ず読み、単位の違う値を混ぜないこと。${CROSS_WORKSPACE_IDENTITY_NOTE}`,
    inputSchema: {
      type: "object",
      properties: {
        treeId: treeIdArg,
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_LIMIT,
          description: `返す最大件数(既定 50、上限 ${MAX_LIMIT})`,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "toban_reward_distributions",
    description:
      "報酬分配(ScheduledDistributor)の予定と実績を返す。分配予定日・対象トークン・" +
      "入金額・実行済み／返却済みの額。金額は ERC-20 の生の単位で、小数桁は" +
      "インデクサーが持っていないため換算していない。**円やドルに読み替えたり、" +
      "THX の額と比べたりしてはいけない。**" +
      "応答の `units` に各数量の単位が入る。合計・比較・割合を出す前に必ず読み、単位の違う値を混ぜないこと。",
    inputSchema: {
      type: "object",
      properties: {
        treeId: treeIdArg,
        status: {
          type: "array",
          items: { type: "string", enum: [...DISTRIBUTOR_STATUSES] },
          description: "絞り込むステータス。既定は全部",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: MAX_LIMIT,
          description: `返す最大件数(既定 20、上限 ${MAX_LIMIT})`,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "toban_thx_propose",
    description:
      "サンクストークン送付の確認ボタンをチャンネルに投稿する。**この時点では何も送られない。** 送付が確定するのは forDiscordUserId 本人がボタンを押したときだけなので、応答では『確認ボタンを出したので押してください』と伝えること。『送りました』と書いてはいけない。常にこのトークンの home ワークスペース宛て。",
    inputSchema: {
      type: "object",
      properties: {
        channelId: {
          ...snowflake,
          description: "確認ボタンを投稿するチャンネル",
        },
        forDiscordUserId: {
          ...snowflake,
          description: "送る本人。この人だけがボタンを押せる",
        },
        toDiscordUserId: {
          ...snowflake,
          description: "送り先の Discord ユーザー ID(toAddress と排他)",
        },
        toAddress: {
          type: "string",
          description:
            "送り先の 0x アドレスまたは ENS 名(toDiscordUserId と排他)",
        },
        amount: {
          type: "integer",
          minimum: 1,
          description: "送る THX の量(整数)",
        },
        message: { type: "string", description: "添えるメッセージ(任意)" },
      },
      required: ["channelId", "forDiscordUserId", "amount"],
      additionalProperties: false,
    },
  },
  {
    name: "toban_quest_submit_propose",
    description:
      "クエスト完了報告の確認ボタンをチャンネルに投稿する。**この時点では何も申請されない。** 確定するのは本人がボタンを押したときだけ。常にこのトークンの home ワークスペース宛て。",
    inputSchema: {
      type: "object",
      properties: {
        channelId: {
          ...snowflake,
          description: "確認ボタンを投稿するチャンネル",
        },
        forDiscordUserId: {
          ...snowflake,
          description: "報告する本人。この人だけがボタンを押せる",
        },
        questId: {
          type: "string",
          description: "クエスト ID(10 進数の文字列)",
        },
      },
      required: ["channelId", "forDiscordUserId", "questId"],
      additionalProperties: false,
    },
  },
];

function ok(text: string): ToolResult {
  return { text };
}
function fail(text: string): ToolResult {
  return { text, isError: true };
}

function str(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** `args.treeId ?? home`, validated as a snowflake-shaped decimal string. */
function resolveTreeId(
  args: Record<string, unknown>,
  home: string,
): string | null {
  const raw = args.treeId;
  if (raw === undefined) return home;
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) return null;
  return raw;
}

/**
 * Validate an enum-array argument.
 *
 * Three outcomes, kept distinct on purpose: `undefined` (not supplied — the
 * caller picks its own default), `null` (supplied but not a valid member, so
 * the tool must refuse rather than silently widen the query), or the values.
 */
function parseStatuses<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T[] | undefined | null {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0) return null;
  if (!value.every((v): v is T => allowed.includes(v as T))) return null;
  return Array.from(new Set(value));
}

/** Quests report a role-share reward; the same block for every quest tool. */
const QUEST_UNITS = unitsFor({ amountShares: "shares" });

/** Attach the frontend permalink an agent can paste into Discord. */
function withQuestUrl<T extends { questId: string }>(
  env: Env,
  treeId: string,
  quest: T,
): T & { url: string } {
  return {
    ...quest,
    url: `${env.TOBAN_FRONTEND_URL}/${treeId}/quest/${quest.questId}`,
  };
}

/**
 * Identity's own `MAX_WALLETS_PER_BATCH`
 * (`pkgs/extensions/identity/src/handlers/lookup-by-wallet.ts`) — a batch
 * above this is rejected with a 400 for the *entire* request, not just the
 * overflow. Kept as a local literal rather than importing identity's
 * source, since this package only ever talks to identity over HTTP
 * (`docs/mcp-extraction.md` §6's boundary rule); a value drift between the
 * two just costs an extra round trip, never a broken request.
 */
const IDENTITY_LOOKUP_CHUNK_SIZE = 200;

/** Result of a (possibly chunked) reverse lookup — see `lookupDiscordIds`. */
type DiscordIdLookupResult = {
  byWallet: Map<string, string | null>;
  /** True if at least one chunk failed. A `null` for a wallet whose chunk
   *  failed is then indistinguishable, on its own, from "confirmed no
   *  binding" — callers that resolve this into a tool response should
   *  surface `degraded` so an agent doesn't report "workspace-wide
   *  unlinked" off of what was actually an identity-worker outage. */
  degraded: boolean;
};

/**
 * Reverse-resolve wallets to Discord user ids so a reading tool can hand the
 * agent something mentionable. The subgraph only knows addresses.
 *
 * **Callers must only invoke this when `treeId === home`** (see §6 of the
 * design doc) — it is the identity boundary that stays a wall even though
 * subgraph reads do not. Every call site below is gated on that check.
 *
 * A wallet with no binding maps to `null` — that is normal, not an error,
 * and must not fail the whole tool call: an unlinked recipient still
 * received the tokens.
 *
 * **Chunked at `IDENTITY_LOOKUP_CHUNK_SIZE`.** `toban_workspace_members`
 * alone can pass `holders * 2 + escrowed` distinct addresses, which at the
 * advertised `MAX_LIMIT` (100) reaches 300 — above identity's cap. Before
 * this chunking, that overflow made the *single* HTTP call 400, which
 * `getIdentitiesByWallets` turned into a thrown error, which this function
 * swallowed into an **empty map for the whole workspace** — every
 * `*DiscordUserId` came back `null`, indistinguishable from "nobody linked a
 * wallet". Chunking here protects every call site, not just the one that
 * happened to be audited (`toban_thx_history` builds its address list from
 * up to `limit` mints' `from`/`to`, which has the same exposure at scale).
 */
async function lookupDiscordIds(
  identity: IdentityClient,
  wallets: readonly string[],
): Promise<DiscordIdLookupResult> {
  const unique = Array.from(new Set(wallets.map((w) => w.toLowerCase())));
  const byWallet = new Map<string, string | null>();
  if (unique.length === 0) return { byWallet, degraded: false };

  let degraded = false;
  for (let i = 0; i < unique.length; i += IDENTITY_LOOKUP_CHUNK_SIZE) {
    const chunk = unique.slice(i, i + IDENTITY_LOOKUP_CHUNK_SIZE);
    let found: Map<string, IdentityRecord[]>;
    try {
      found = await identity.getIdentitiesByWallets("discord", chunk);
    } catch (err) {
      // Keep the existing "identity down -> answer with what we have"
      // behaviour instead of failing the whole tool call, but log per-chunk
      // (not once for the whole request) so an operator can tell "identity
      // was flaky for part of a large workspace" apart from "identity was
      // fully down" in the logs.
      console.error(
        `MCP reverse lookup failed for a chunk of ${chunk.length} wallet(s):`,
        err,
      );
      degraded = true;
      continue;
    }
    for (const wallet of chunk) {
      byWallet.set(wallet, found.get(wallet)?.[0]?.accountId ?? null);
    }
  }
  // Wallets from a failed chunk still need an entry (callers index this map
  // unconditionally with `?? null`), but they are set only after the loop
  // so a wallet that appears in both a failed and a succeeded chunk (it
  // can't, chunks are disjoint, but this keeps the intent explicit) never
  // has a real result overwritten by the degraded fallback.
  if (degraded) {
    for (const wallet of unique) {
      if (!byWallet.has(wallet)) byWallet.set(wallet, null);
    }
  }
  return { byWallet, degraded };
}

/**
 * Dispatch one tool call.
 *
 * `auth.treeId` is the token's home workspace, from `auth.ts` — never from
 * `args`. Read tools may look at another workspace via `args.treeId`, but
 * identity resolution (`discordUserId` args and reverse lookups) only ever
 * runs when the effective treeId equals the home.
 */
export async function callTool(
  env: Env,
  auth: AuthContext,
  name: string,
  args: Record<string, unknown>,
  deps: McpToolDeps = {},
): Promise<ToolResult> {
  const identity = deps.identity ?? createIdentityClient(env);
  const fetchImpl = deps.fetchImpl ?? fetch;
  const home = auth.treeId;

  switch (name) {
    case "toban_workspace_info": {
      const overview = await resolveWorkspaceOverview(env, home, fetchImpl);
      return ok(
        JSON.stringify({
          treeId: home,
          chainId: Number(env.CHAIN_ID),
          url: `${env.TOBAN_FRONTEND_URL}/${home}`,
          // Null when BigBang's `Executed` event is not indexed yet.
          ...(overview
            ? {
                createdAt: overview.createdAt,
                creator: overview.creator,
                owner: overview.owner,
                hats: overview.hats,
                modules: overview.modules,
              }
            : { indexed: false }),
        }),
      );
    }

    case "toban_member_status": {
      const treeId = resolveTreeId(args, home);
      if (treeId === null) return fail("treeId の形式が正しくありません。");
      const userId = str(args, "discordUserId");
      if (!userId) return fail("discordUserId は必須です。");
      if (treeId !== home) {
        return fail(
          "他のワークスペースを指定した場合、discordUserId は解決できません。",
        );
      }
      const record = await identity.getIdentity("discord", userId);
      if (!record) {
        return ok(
          JSON.stringify({
            linked: false,
            hint: "`/toban-setup` を実行してウォレットを連携してもらってください。",
          }),
        );
      }
      const owner = record.wallet as Address;
      const resolveToken =
        deps.resolveTokenAddress ??
        ((tid: string) => resolveThanksTokenAddress(env, tid));
      const [token, relatedRoles, totals] = await Promise.all([
        resolveToken(treeId),
        resolveRelatedRoles(env, owner, treeId, fetchImpl),
        resolveThanksTotals(env, treeId, owner, fetchImpl),
      ]);
      if (!token) {
        return fail(
          `ワークスペースの ThanksToken を取得できませんでした(tree ${treeId})。`,
        );
      }
      const client = getPublicClient(env);
      const [allowance, mintable] = await Promise.all([
        client.readContract({
          address: token,
          abi: THANKS_TOKEN_ABI,
          functionName: "mintAllowance",
          args: [owner, env.TURNKEY_BOT_SIGNER_ADDRESS as Hex],
        }),
        client.readContract({
          address: token,
          abi: THANKS_TOKEN_ABI,
          functionName: "mintableAmount",
          args: [owner, relatedRoles],
        }),
      ]);
      return ok(
        JSON.stringify({
          linked: true,
          wallet: owner,
          thxBalance: totals.balanceThx,
          thxSentTotal: totals.sentTotalThx,
          botAllowanceThx: formatEther(allowance as bigint),
          mintableThx: formatEther(mintable as bigint),
          roles: relatedRoles.map((r) => ({
            hatId: r.hatId.toString(),
            wearer: r.wearer,
          })),
          units: unitsFor({
            thxBalance: "thx",
            thxSentTotal: "thx",
            botAllowanceThx: "thx",
            mintableThx: "thx",
          }),
        }),
      );
    }

    case "toban_open_quests": {
      const treeId = resolveTreeId(args, home);
      if (treeId === null) return fail("treeId の形式が正しくありません。");
      const statuses = parseStatuses(args.status, QUEST_STATUSES);
      if (statuses === null) {
        return fail(
          `status には ${QUEST_STATUSES.join(" / ")} のいずれかを指定してください。`,
        );
      }
      const limit = clampLimit(args.limit, 20);
      const userId = str(args, "discordUserId");

      if (!userId) {
        const quests = await resolveQuests(
          env,
          treeId,
          { statuses: statuses ?? ["Open"], limit },
          fetchImpl,
        );
        return ok(
          JSON.stringify({
            quests: quests.map((q) => withQuestUrl(env, treeId, q)),
            units: QUEST_UNITS,
          }),
        );
      }

      if (treeId !== home) {
        return fail(
          "他のワークスペースを指定した場合、discordUserId は解決できません。",
        );
      }
      if (statuses && (statuses.length !== 1 || statuses[0] !== "Open")) {
        return fail(
          "discordUserId を指定した場合、完了報告できるのは Open のクエストだけなので status は指定できません。",
        );
      }
      const record = await identity.getIdentity("discord", userId);
      if (!record) return ok(JSON.stringify({ linked: false, quests: [] }));
      const actor = record.wallet as Address;
      const [membership, quests] = await Promise.all([
        resolveMembershipHatId(env, actor, treeId, fetchImpl),
        resolveQuests(env, treeId, { statuses: ["Open"], limit }, fetchImpl),
      ]);
      if (membership === null) {
        return ok(
          JSON.stringify({
            linked: true,
            member: false,
            quests: [],
            hint: "このワークスペースのメンバーではないため、完了報告はできません。",
          }),
        );
      }
      const actorLower = actor.toLowerCase();
      return ok(
        JSON.stringify({
          linked: true,
          member: true,
          quests: quests
            .filter((q) => q.creator.toLowerCase() !== actorLower)
            .map((q) => withQuestUrl(env, treeId, q)),
          units: QUEST_UNITS,
        }),
      );
    }

    case "toban_quest_detail": {
      const treeId = resolveTreeId(args, home);
      if (treeId === null) return fail("treeId の形式が正しくありません。");
      const questId = str(args, "questId");
      if (!questId || !/^\d+$/.test(questId)) {
        return fail("questId には 10 進数の文字列を指定してください。");
      }
      const quest = await resolveQuestDetail(env, treeId, questId, fetchImpl);
      if (!quest) {
        return fail(
          `クエスト #${questId} はこのワークスペースに見つかりませんでした。`,
        );
      }
      return ok(
        JSON.stringify({
          ...withQuestUrl(env, treeId, quest),
          units: QUEST_UNITS,
        }),
      );
    }

    case "toban_thx_history": {
      const treeId = resolveTreeId(args, home);
      if (treeId === null) return fail("treeId の形式が正しくありません。");
      const limit = clampLimit(args.limit, 20);
      const direction = str(args, "direction") ?? "any";
      if (!["sent", "received", "any"].includes(direction)) {
        return fail(
          "direction には sent / received / any を指定してください。",
        );
      }
      const sinceDays = args.sinceDays;
      if (
        sinceDays !== undefined &&
        (typeof sinceDays !== "number" ||
          !Number.isInteger(sinceDays) ||
          sinceDays <= 0)
      ) {
        return fail("sinceDays には 1 以上の整数を指定してください。");
      }
      const sinceUnix =
        typeof sinceDays === "number"
          ? Math.floor(Date.now() / 1000) - sinceDays * 86400
          : undefined;

      const userId = str(args, "discordUserId");
      if (userId && treeId !== home) {
        return fail(
          "他のワークスペースを指定した場合、discordUserId は解決できません。",
        );
      }
      let wallet: Address | undefined;
      if (userId) {
        const record = await identity.getIdentity("discord", userId);
        if (!record) {
          return ok(
            JSON.stringify({
              linked: false,
              mints: [],
              hint: "このユーザーはまだウォレットを連携していません。",
            }),
          );
        }
        wallet = record.wallet as Address;
      }

      const mints = await resolveThanksHistory(
        env,
        treeId,
        {
          wallet,
          direction: direction as "sent" | "received" | "any",
          sinceUnix,
          limit,
        },
        fetchImpl,
      );
      // Reverse lookup is the identity boundary (§6) — only for home.
      const { byWallet, degraded } =
        treeId === home
          ? await lookupDiscordIds(
              identity,
              mints.flatMap((m) => [m.from, m.to]),
            )
          : { byWallet: new Map<string, string | null>(), degraded: false };
      return ok(
        JSON.stringify({
          mints: mints.map((m) => ({
            ...m,
            fromDiscordUserId: byWallet.get(m.from.toLowerCase()) ?? null,
            toDiscordUserId: byWallet.get(m.to.toLowerCase()) ?? null,
          })),
          units: unitsFor({ amountThx: "thx" }),
          // Only present when true: a partial identity-lookup failure means
          // some `*DiscordUserId: null` above may actually be "unknown", not
          // "confirmed unlinked" — see `lookupDiscordIds`.
          ...(degraded ? { identityLookupDegraded: true } : {}),
        }),
      );
    }

    case "toban_workspace_members": {
      const treeId = resolveTreeId(args, home);
      if (treeId === null) return fail("treeId の形式が正しくありません。");
      const limit = clampLimit(args.limit, 50);
      const roles = await resolveWorkspaceRoles(env, treeId, limit, fetchImpl);
      const { byWallet, degraded } =
        treeId === home
          ? await lookupDiscordIds(identity, [
              ...roles.holders.flatMap((h) => [h.owner, h.wearer]),
              ...roles.escrowed.map((e) => e.wearer),
            ])
          : { byWallet: new Map<string, string | null>(), degraded: false };
      return ok(
        JSON.stringify({
          holders: roles.holders.map((h) => ({
            ...h,
            ownerDiscordUserId: byWallet.get(h.owner.toLowerCase()) ?? null,
            wearerDiscordUserId: byWallet.get(h.wearer.toLowerCase()) ?? null,
          })),
          escrowed: roles.escrowed.map((e) => ({
            ...e,
            wearerDiscordUserId: byWallet.get(e.wearer.toLowerCase()) ?? null,
          })),
          units: unitsFor({ shares: "shares" }),
          // Only present when true — see `toban_thx_history` above.
          ...(degraded ? { identityLookupDegraded: true } : {}),
        }),
      );
    }

    case "toban_reward_distributions": {
      const treeId = resolveTreeId(args, home);
      if (treeId === null) return fail("treeId の形式が正しくありません。");
      const statuses = parseStatuses(args.status, DISTRIBUTOR_STATUSES);
      if (statuses === null) {
        return fail(
          `status には ${DISTRIBUTOR_STATUSES.join(" / ")} のいずれかを指定してください。`,
        );
      }
      const distributions = await resolveRewardDistributions(
        env,
        treeId,
        { statuses: statuses ?? undefined, limit: clampLimit(args.limit, 20) },
        fetchImpl,
      );
      return ok(
        JSON.stringify({
          distributions,
          units: unitsFor({
            totalDepositedRaw: "raw",
            executedAmountRaw: "raw",
            reclaimedAmountRaw: "raw",
          }),
        }),
      );
    }

    case "toban_thx_propose":
    case "toban_quest_submit_propose":
      return proposeTool(env, home, name, args, deps);

    default:
      return fail(`unknown tool: ${name}`);
  }
}

/**
 * Forward a propose call to `@toban/discord-bot`'s `POST /internal/propose`
 * over the `CONFIRM` service binding. This function never builds a
 * `ConfirmPayload` and never talks to Discord's REST API — it only packages
 * the tool arguments into an `InternalProposeRequest` and relays the answer.
 *
 * Always uses `home` as the target treeId: propose tools take no `treeId`
 * argument (see `TOOL_DEFINITIONS`), because writes stay boundary-as-wall
 * even though reads do not (§2, §6 of the design doc).
 */
async function proposeTool(
  env: Env,
  home: string,
  name: string,
  args: Record<string, unknown>,
  deps: McpToolDeps,
): Promise<ToolResult> {
  const channelId = str(args, "channelId");
  const forUser = str(args, "forDiscordUserId");
  if (!channelId || !forUser) {
    return fail("channelId と forDiscordUserId は必須です。");
  }

  let request: InternalProposeRequest;
  if (name === "toban_thx_propose") {
    const amountRaw = args.amount;
    if (
      typeof amountRaw !== "number" ||
      !Number.isInteger(amountRaw) ||
      amountRaw <= 0
    ) {
      return fail("amount には 1 以上の整数を指定してください。");
    }
    const toUser = str(args, "toDiscordUserId");
    const toAddress = str(args, "toAddress");
    if (!toUser && !toAddress) {
      return fail("toDiscordUserId か toAddress のどちらかが必要です。");
    }
    if (toAddress && !toAddress.endsWith(".eth") && !isAddress(toAddress)) {
      return fail(`アドレスの形式が正しくありません: ${toAddress}`);
    }
    // Validates only; discord-bot re-parses from its own payload.
    parseEther(String(amountRaw));
    request = {
      kind: "thx",
      treeId: home,
      channelId,
      forDiscordUserId: forUser,
      toDiscordUserId: toUser,
      toAddress,
      amount: amountRaw,
      message: str(args, "message"),
    };
  } else {
    const questId = str(args, "questId");
    if (!questId || !/^\d+$/.test(questId)) {
      return fail("questId には 10 進数の文字列を指定してください。");
    }
    request = {
      kind: "quest",
      treeId: home,
      channelId,
      forDiscordUserId: forUser,
      questId,
    };
  }

  const fetchImpl: typeof fetch =
    deps.proposeFetch ??
    ((input, init) => env.CONFIRM.fetch(input as string, init));
  let res: Response;
  try {
    res = await fetchImpl(
      "https://discord-bot.toban.internal/internal/propose",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-toban-mcp-propose-secret": env.MCP_INTERNAL_PROPOSE_SECRET,
        },
        body: JSON.stringify(request),
      },
    );
  } catch (err) {
    console.error("propose forward failed:", err);
    return fail(
      "確認メッセージの依頼に失敗しました。少し時間をおいて再度お試しください。",
    );
  }
  if (!res.ok) {
    return fail(
      "確認メッセージの依頼に失敗しました。少し時間をおいて再度お試しください。",
    );
  }
  const body = (await res.json()) as InternalProposeResponse;
  if (!body.ok) return fail(body.error);

  return ok(
    name === "toban_thx_propose"
      ? `確認ボタンを <#${channelId}> に投稿しました。<@${forUser}> が「実行する」を押すと送付されます。まだ何も送られていません。`
      : `確認ボタンを <#${channelId}> に投稿しました。<@${forUser}> が「実行する」を押すと申請されます。まだ何も申請されていません。`,
  );
}
