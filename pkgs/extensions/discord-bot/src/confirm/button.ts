/**
 * The click half of the confirm flow. This is the only place where an
 * agent-originated proposal turns into a signed transaction.
 *
 * Order of operations matters:
 *
 *  1. Check the clicker is the person the proposal was addressed to.
 *  2. Strip the buttons **before** doing any work — two fast clicks would
 *     otherwise mint twice. Not atomic, but it closes the realistic window;
 *     a proper guard needs a store this Worker deliberately does not have.
 *  3. Defer, then sign in the background (Discord's 3-second budget).
 */
import {
  type APIInteractionResponse,
  type APIMessageComponentInteraction,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";
import { parseEther } from "viem";
import {
  formatQuestSubmitSuccess,
  performQuestSubmit,
} from "../commands/quest-submit";
import { sendFollowup } from "../commands/responses";
import { formatThxSuccess, performThx } from "../commands/thx";
import type { Env } from "../env";
import {
  CANCEL_CUSTOM_ID,
  CONFIRM_CUSTOM_ID,
  type ConfirmPayload,
  decodePayload,
} from "./confirm";
import { type DiscordRest, createDiscordRest } from "./discord-rest";

export interface ButtonDeps {
  rest?: DiscordRest;
  followup?: (appId: string, token: string, content: string) => Promise<void>;
  performThx?: typeof performThx;
  performQuestSubmit?: typeof performQuestSubmit;
}

function ephemeralNow(content: string): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content, flags: MessageFlags.Ephemeral },
  };
}

/** True when this interaction is one of our confirm buttons. */
export function isConfirmComponent(customId: string): boolean {
  return customId === CONFIRM_CUSTOM_ID || customId === CANCEL_CUSTOM_ID;
}

export function readPayload(
  interaction: APIMessageComponentInteraction,
): ConfirmPayload | null {
  return decodePayload(interaction.message?.embeds?.[0]?.footer?.text);
}

export function handleConfirmButton(
  env: Env,
  ctx: ExecutionContext,
  interaction: APIMessageComponentInteraction,
  deps: ButtonDeps = {},
): APIInteractionResponse {
  const rest = deps.rest ?? createDiscordRest(env.DISCORD_BOT_TOKEN);
  const followup = deps.followup ?? sendFollowup;
  const payload = readPayload(interaction);
  const clicker = interaction.member?.user.id ?? interaction.user?.id;
  const channelId = interaction.channel?.id;
  const messageId = interaction.message?.id;

  if (!payload || !clicker || !channelId || !messageId) {
    return ephemeralNow("この確認メッセージは読み取れませんでした。");
  }
  // The proposal names who may act; the click says who did. Only the second
  // one is trustworthy, so all we do with the first is refuse a mismatch.
  if (clicker !== payload.forUser) {
    return ephemeralNow(
      `この確認は <@${payload.forUser}> 宛てです。本人が押してください。`,
    );
  }
  // Defence in depth: a payload can only reach the guild it was posted to,
  // but never act on a guild the interaction did not come from.
  if (interaction.guild_id !== payload.guildId) {
    return ephemeralNow("サーバーが一致しません。");
  }

  const strip = (note: string) =>
    rest.editMessage(channelId, messageId, {
      components: [],
      content: `${interaction.message?.content ?? ""}\n${note}`,
      allowed_mentions: { parse: [] },
    });

  if (interaction.data.custom_id === CANCEL_CUSTOM_ID) {
    ctx.waitUntil(strip("— やめました。"));
    return ephemeralNow("やめました。");
  }

  ctx.waitUntil(
    (async () => {
      try {
        await strip("— 実行中…");
        const content = await execute(env, payload, clicker, deps);
        await followup(env.DISCORD_APP_ID, interaction.token, content);
      } catch (err) {
        console.error("confirm button unhandled:", err);
        try {
          await followup(
            env.DISCORD_APP_ID,
            interaction.token,
            "処理中にエラーが発生しました。少し時間をおいて再度お試しください。",
          );
        } catch (followupErr) {
          console.error("confirm followup-after-error failed:", followupErr);
        }
      }
    })(),
  );

  return {
    type: InteractionResponseType.DeferredChannelMessageWithSource,
    data: { flags: MessageFlags.Ephemeral },
  };
}

async function execute(
  env: Env,
  payload: ConfirmPayload,
  actorSf: string,
  deps: ButtonDeps,
): Promise<string> {
  if (payload.kind === "thx") {
    const run = deps.performThx ?? performThx;
    const outcome = await run(env, {
      actorSf,
      guildId: payload.guildId,
      recipient:
        "user" in payload.target
          ? { kind: "snowflake", value: payload.target.user }
          : { kind: "address", value: payload.target.address },
      amount: parseEther(payload.amount),
      message: payload.message,
    });
    return outcome.ok
      ? formatThxSuccess(outcome, { showAddress: "address" in payload.target })
      : outcome.error;
  }

  const run = deps.performQuestSubmit ?? performQuestSubmit;
  const outcome = await run(env, {
    actorSf,
    guildId: payload.guildId,
    questId: BigInt(payload.questId),
  });
  return outcome.ok ? formatQuestSubmitSuccess(outcome) : outcome.error;
}
