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

/** POST a followup message to a deferred interaction. */
export async function sendFollowup(
  applicationId: string,
  interactionToken: string,
  content: string,
): Promise<void> {
  const res = await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, flags: MessageFlags.Ephemeral }),
    },
  );
  if (!res.ok) {
    // Followups are best-effort; log but don't throw so the caller's
    // ctx.waitUntil promise resolves cleanly.
    console.error(`discord followup failed: ${res.status} ${await res.text()}`);
  }
}
