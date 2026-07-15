/**
 * Helpers for assembling Discord interaction responses + followups.
 *
 * All "user-facing" strings live here so localisation later is mechanical.
 */
import {
  type APIInteractionResponse,
  InteractionResponseType,
  MessageFlags,
} from "discord-api-types/v10";

export function ephemeral(content: string): APIInteractionResponse {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: { content, flags: MessageFlags.Ephemeral },
  };
}

export function deferredEphemeral(): APIInteractionResponse {
  return {
    type: InteractionResponseType.DeferredChannelMessageWithSource,
    data: { flags: MessageFlags.Ephemeral },
  };
}

export function pong(): APIInteractionResponse {
  return { type: InteractionResponseType.Pong };
}

/** Discord rejects message content longer than 2000 chars (error 50035). */
const DISCORD_MAX_CONTENT = 2000;

/** POST a followup message to a deferred interaction. */
export async function sendFollowup(
  applicationId: string,
  interactionToken: string,
  content: string,
): Promise<void> {
  // Clamp to Discord's 2000-char limit — otherwise the followup is rejected
  // with a 400 and the user sees nothing (verbose viem/Turnkey errors blow
  // past this easily).
  const body =
    content.length > DISCORD_MAX_CONTENT
      ? `${content.slice(0, DISCORD_MAX_CONTENT - 1)}…`
      : content;
  const res = await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: body, flags: MessageFlags.Ephemeral }),
    },
  );
  if (!res.ok) {
    // Followups are best-effort; log but don't throw so the caller's
    // ctx.waitUntil promise resolves cleanly.
    console.error(`discord followup failed: ${res.status} ${await res.text()}`);
  }
}
