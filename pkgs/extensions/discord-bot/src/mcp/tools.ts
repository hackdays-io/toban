/**
 * Toban's MCP tool surface.
 *
 * Two kinds of tool, and the split matters:
 *
 * - **Reads** answer about the guild in the caller's token. They are safe to
 *   expose to an agent we do not run, because the token pins the guild.
 * - **Proposals** never touch the chain. They post a confirm message and stop.
 *   Signing happens later, from the button click — see `confirm.ts`.
 *
 * Every tool takes a Discord user id for *whom* it is acting. That id is only
 * ever used to look something up or to decide who may press a button. It can
 * never authorise an action, so an agent getting it wrong (or lying) cannot
 * move value.
 */
import {
  type Address,
  type Hex,
  formatEther,
  isAddress,
  parseEther,
} from "viem";
import {
  THANKS_TOKEN_ABI,
  getPublicClient,
  resolveMembershipHatId,
  resolveRelatedRoles,
  resolveSubmittableQuests,
  resolveThanksTokenAddress,
} from "../chain";
import { questChoiceLabel } from "../commands/quest-submit";
import type { Env } from "../env";
import { type IdentityClient, createIdentityClient } from "../identity";
import { buildConfirmMessage } from "./confirm";
import { type DiscordRest, createDiscordRest } from "./discord-rest";
import type { ToolDefinition, ToolResult } from "./protocol";

export interface McpToolDeps {
  identity?: IdentityClient;
  rest?: DiscordRest;
  resolveTokenAddress?: (treeId: string) => Promise<Hex | null>;
}

const snowflake = { type: "string", pattern: "^\\d+$" } as const;

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "toban_workspace_info",
    description:
      "このサーバーに紐づく Toban ワークスペース（tree id・チェーン・URL）を返す。まずこれを呼んで、サーバーが Toban に連携済みか確かめる。",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "toban_member_status",
    description:
      "指定した Discord ユーザーのウォレット連携状況と、サンクストークンの送信可能枠を返す。送付を提案する前に枠が足りるか確認するのに使う。",
    inputSchema: {
      type: "object",
      properties: {
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
    description:
      "指定した Discord ユーザーが完了報告できるクエストの一覧を返す。",
    inputSchema: {
      type: "object",
      properties: {
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
    name: "toban_thx_propose",
    description:
      "サンクストークン送付の確認ボタンをチャンネルに投稿する。**この時点では何も送られない。** 送付が確定するのは forDiscordUserId 本人がボタンを押したときだけなので、応答では『確認ボタンを出したので押してください』と伝えること。『送りました』と書いてはいけない。",
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
          description: "送り先の Discord ユーザー ID（toAddress と排他）",
        },
        toAddress: {
          type: "string",
          description:
            "送り先の 0x アドレスまたは ENS 名（toDiscordUserId と排他）",
        },
        amount: {
          type: "integer",
          minimum: 1,
          description: "送る THX の量（整数）",
        },
        message: { type: "string", description: "添えるメッセージ（任意）" },
      },
      required: ["channelId", "forDiscordUserId", "amount"],
      additionalProperties: false,
    },
  },
  {
    name: "toban_quest_submit_propose",
    description:
      "クエスト完了報告の確認ボタンをチャンネルに投稿する。**この時点では何も申請されない。** 確定するのは本人がボタンを押したときだけ。",
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
          description: "クエスト ID（10 進数の文字列）",
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

/**
 * Dispatch one tool call.
 *
 * `guildId` comes from the bearer token, never from `args` — see `auth.ts`.
 */
export async function callTool(
  env: Env,
  guildId: string,
  name: string,
  args: Record<string, unknown>,
  deps: McpToolDeps = {},
): Promise<ToolResult> {
  const identity = deps.identity ?? createIdentityClient(env);
  const link = await identity.getPlatformLink("discord", guildId);
  if (!link) {
    return fail(
      "このサーバーはまだ Toban ワークスペースに連携されていません。管理者に `/toban-link` の実行を依頼してください。",
    );
  }

  switch (name) {
    case "toban_workspace_info":
      return ok(
        JSON.stringify({
          treeId: link.treeId,
          chainId: Number(env.CHAIN_ID),
          url: `${env.TOBAN_FRONTEND_URL}/${link.treeId}`,
        }),
      );

    case "toban_member_status": {
      const userId = str(args, "discordUserId");
      if (!userId) return fail("discordUserId は必須です。");
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
        ((treeId: string) => resolveThanksTokenAddress(env, treeId));
      const [token, relatedRoles] = await Promise.all([
        resolveToken(link.treeId),
        resolveRelatedRoles(env, owner, link.treeId),
      ]);
      if (!token) {
        return fail(
          `ワークスペースの ThanksToken を取得できませんでした（tree ${link.treeId}）。`,
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
          botAllowanceThx: formatEther(allowance as bigint),
          mintableThx: formatEther(mintable as bigint),
        }),
      );
    }

    case "toban_open_quests": {
      const userId = str(args, "discordUserId");
      if (!userId) return fail("discordUserId は必須です。");
      const record = await identity.getIdentity("discord", userId);
      if (!record) return ok(JSON.stringify({ linked: false, quests: [] }));
      const actor = record.wallet as Address;
      const [membership, quests] = await Promise.all([
        resolveMembershipHatId(env, actor, link.treeId),
        resolveSubmittableQuests(env, link.treeId, actor),
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
      return ok(
        JSON.stringify({
          linked: true,
          member: true,
          quests: quests.map((q) => ({
            questId: q.questId.toString(),
            label: questChoiceLabel(q),
          })),
        }),
      );
    }

    case "toban_thx_propose":
    case "toban_quest_submit_propose":
      return proposeTool(env, guildId, link.treeId, name, args, deps);

    default:
      return fail(`unknown tool: ${name}`);
  }
}

async function proposeTool(
  env: Env,
  guildId: string,
  treeId: string,
  name: string,
  args: Record<string, unknown>,
  deps: McpToolDeps,
): Promise<ToolResult> {
  const channelId = str(args, "channelId");
  const forUser = str(args, "forDiscordUserId");
  if (!channelId || !forUser) {
    return fail("channelId と forDiscordUserId は必須です。");
  }

  const rest = deps.rest ?? createDiscordRest(env.DISCORD_BOT_TOKEN);
  // The token pins the guild; the channel does not. Without this check a
  // caller could post a proposal into any channel the bot can see, in any
  // server it is installed in.
  const channelGuild = await rest.getChannelGuildId(channelId);
  if (channelGuild !== guildId) {
    return fail(
      "指定されたチャンネルはこのサーバーのものではないか、Bot から見えません。",
    );
  }

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
    // parseEther here only validates; the button path re-parses from the
    // payload so the two can never disagree about the scale.
    parseEther(String(amountRaw));

    const posted = await rest.postMessage(
      channelId,
      buildConfirmMessage({
        kind: "thx",
        guildId,
        forUser,
        target: toUser ? { user: toUser } : { address: toAddress as string },
        amount: String(amountRaw),
        message: str(args, "message") ?? "",
      }),
    );
    if (!posted) return fail("確認メッセージを投稿できませんでした。");
    return ok(
      `確認ボタンを <#${channelId}> に投稿しました。<@${forUser}> が「実行する」を押すと送付されます。まだ何も送られていません。`,
    );
  }

  const questId = str(args, "questId");
  if (!questId || !/^\d+$/.test(questId)) {
    return fail("questId には 10 進数の文字列を指定してください。");
  }
  const posted = await rest.postMessage(
    channelId,
    buildConfirmMessage({
      kind: "quest",
      guildId,
      forUser,
      questId,
      questLabel: `${env.TOBAN_FRONTEND_URL}/${treeId}/quest/${questId}`,
    }),
  );
  if (!posted) return fail("確認メッセージを投稿できませんでした。");
  return ok(
    `確認ボタンを <#${channelId}> に投稿しました。<@${forUser}> が「実行する」を押すと申請されます。まだ何も申請されていません。`,
  );
}
