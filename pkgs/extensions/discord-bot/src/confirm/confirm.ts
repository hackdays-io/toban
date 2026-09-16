/**
 * The confirm-button bridge between an untrusted agent and a signed action.
 *
 * ## Why this exists
 *
 * An MCP caller — a third-party OpenClaw, our own agent, anything holding a
 * guild token — can only *propose*. It posts a message describing what would
 * happen. Nothing reaches Turnkey until a human clicks the button, and the
 * click arrives as a Discord interaction that Discord itself Ed25519-signed.
 *
 * **The actor is the clicker.** It is read from `interaction.member.user.id`,
 * never from the proposal. That is what makes it safe to let an agent we do
 * not control drive this: the worst a hostile proposal can do is show someone
 * a button whose visible text says exactly what pressing it will do.
 *
 * The proposal itself rides in the embed footer as base64url JSON. Only the
 * bot can author or edit its own messages, and the click round-trips through
 * Discord's signature, so the payload comes back intact — no separate store
 * and no MAC of our own is needed. It must still never carry the actor.
 */
import type { APIEmbed } from "discord-api-types/v10";

export const CONFIRM_CUSTOM_ID = "toban:confirm";
export const CANCEL_CUSTOM_ID = "toban:cancel";

const FOOTER_PREFIX = "toban:v1:";

export type ConfirmTarget = { user: string } | { address: string };

export type ConfirmPayload =
  | {
      kind: "thx";
      guildId: string;
      /** Discord snowflake allowed to press the button. */
      forUser: string;
      target: ConfirmTarget;
      /** Human-readable THX count, e.g. "5". */
      amount: string;
      message: string;
    }
  | {
      kind: "quest";
      guildId: string;
      forUser: string;
      questId: string;
      questLabel: string;
    };

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): string {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodePayload(payload: ConfirmPayload): string {
  return FOOTER_PREFIX + toBase64Url(JSON.stringify(payload));
}

export function decodePayload(
  footerText: string | undefined,
): ConfirmPayload | null {
  if (!footerText?.startsWith(FOOTER_PREFIX)) return null;
  try {
    const parsed = JSON.parse(
      fromBase64Url(footerText.slice(FOOTER_PREFIX.length)),
    ) as ConfirmPayload;
    if (parsed.kind !== "thx" && parsed.kind !== "quest") return null;
    if (!parsed.guildId || !parsed.forUser) return null;
    return parsed;
  } catch {
    return null;
  }
}

function targetLabel(target: ConfirmTarget): string {
  return "user" in target ? `<@${target.user}>` : `\`${target.address}\``;
}

/** The message an agent's proposal turns into. */
export function buildConfirmMessage(payload: ConfirmPayload): {
  content: string;
  embeds: APIEmbed[];
  components: unknown[];
  allowed_mentions: { parse: []; users: string[] };
} {
  const embed: APIEmbed =
    payload.kind === "thx"
      ? {
          title: "サンクスの送付を確認",
          description: [
            `送り先: ${targetLabel(payload.target)}`,
            `量: **${payload.amount}** THX`,
            payload.message ? `メッセージ: > ${payload.message}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          footer: { text: encodePayload(payload) },
        }
      : {
          title: "クエストの完了報告を確認",
          description: [
            `クエスト: **${payload.questLabel}**`,
            "作成者の承認、またはメンバー2名の承認で完了します。",
          ].join("\n"),
          footer: { text: encodePayload(payload) },
        };

  return {
    content: `<@${payload.forUser}> 内容を確認して、問題なければ「実行する」を押してください。`,
    embeds: [embed],
    components: [
      {
        type: 1, // ACTION_ROW
        components: [
          {
            type: 2, // BUTTON
            style: 3, // SUCCESS
            label: "実行する",
            custom_id: CONFIRM_CUSTOM_ID,
          },
          {
            type: 2,
            style: 2, // SECONDARY
            label: "やめる",
            custom_id: CANCEL_CUSTOM_ID,
          },
        ],
      },
    ],
    // The agent controls the text, so no mention in it may resolve. The one
    // exception is the person who has to press the button — they are the only
    // one who needs to see this, and `users` overrides the empty `parse`.
    allowed_mentions: { parse: [], users: [payload.forUser] },
  };
}
