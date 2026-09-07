/**
 * The slice of Discord's REST API the MCP path needs.
 *
 * Kept separate from `commands/responses.ts` because those helpers all answer
 * an *interaction* (webhook + token); these act as the bot on a channel.
 */
const API = "https://discord.com/api/v10";

function botHeaders(token: string): HeadersInit {
  return {
    authorization: `Bot ${token}`,
    "content-type": "application/json",
  };
}

export interface DiscordRest {
  /** Guild a channel belongs to, or null when it is unreachable. */
  getChannelGuildId(channelId: string): Promise<string | null>;
  postMessage(channelId: string, body: unknown): Promise<{ id: string } | null>;
  editMessage(
    channelId: string,
    messageId: string,
    body: unknown,
  ): Promise<void>;
}

export function createDiscordRest(botToken: string): DiscordRest {
  return {
    async getChannelGuildId(channelId) {
      const res = await fetch(`${API}/channels/${channelId}`, {
        headers: botHeaders(botToken),
      });
      if (!res.ok) {
        console.error(`discord getChannel failed: ${res.status}`);
        return null;
      }
      const body = (await res.json()) as { guild_id?: string };
      return body.guild_id ?? null;
    },
    async postMessage(channelId, body) {
      const res = await fetch(`${API}/channels/${channelId}/messages`, {
        method: "POST",
        headers: botHeaders(botToken),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error(
          `discord postMessage failed: ${res.status} ${await res.text()}`,
        );
        return null;
      }
      return (await res.json()) as { id: string };
    },
    async editMessage(channelId, messageId, body) {
      const res = await fetch(
        `${API}/channels/${channelId}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: botHeaders(botToken),
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        // Best-effort: the edit only tidies the message up. Losing it must not
        // abort the flow that already signed a transaction.
        console.error(
          `discord editMessage failed: ${res.status} ${await res.text()}`,
        );
      }
    },
  };
}
