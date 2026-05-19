/**
 * /toban-link <workspace_url>
 *
 * Admin-flow entry point in Discord. Resolves the workspace tree id from
 * the URL, looks up the caller's wallet via identity, and upserts the
 * (provider=discord, platform_id=guild_id) → tree_id binding in the
 * shared D1 (via identity worker HTTP API).
 *
 * The original #508 spec routed admins through a Discord OAuth install
 * flow that ran on /api/install/callback. That makes sense when the
 * admin starts from the frontend (`/<treeId>` → "Discord 連携" button →
 * OAuth → callback binds), but reduces to extra hops when the admin
 * already has the bot in their guild. The OAuth callback handler still
 * exists for the frontend-initiated path; this slash command is the
 * Discord-initiated shortcut.
 *
 * Admin Hat on-chain verification is TODO — for MVP we trust the
 * URL-bearer to actually be the workspace admin.
 */
import type {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";
import type { Env } from "../env";
import { type IdentityClient, createIdentityClient } from "../identity";
import { ephemeral } from "./responses";

function extractTreeId(workspaceUrl: string): string | null {
  try {
    const u = new URL(workspaceUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const treeId = parts[0];
    if (!/^[0-9a-fA-Fx]+$/.test(treeId)) return null;
    return treeId;
  } catch {
    return null;
  }
}

export interface TobanLinkDeps {
  identity?: IdentityClient;
}

export async function handleTobanLink(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
  deps: TobanLinkDeps = {},
): Promise<APIInteractionResponse> {
  const guildId = interaction.guild_id;
  if (!guildId) {
    return ephemeral("This command must be run inside a server.");
  }

  const opts = interaction.data?.options ?? [];
  let workspaceUrl = "";
  for (const opt of opts) {
    const o = opt as { name: string; value?: string };
    if (o.name === "workspace_url" && typeof o.value === "string") {
      workspaceUrl = o.value;
    }
  }
  const treeId = extractTreeId(workspaceUrl);
  if (!treeId) {
    return ephemeral(
      "Could not parse a Toban workspace URL. Expected something like https://toban.xyz/<treeId>",
    );
  }

  const callerSnowflake = interaction.member?.user.id ?? interaction.user?.id;
  if (!callerSnowflake) {
    return ephemeral("Could not read your Discord user id.");
  }

  const identity = deps.identity ?? createIdentityClient(env);
  const caller = await identity.getIdentity("discord", callerSnowflake);
  if (!caller) {
    return ephemeral(
      "Run `/toban-setup` first so we know which wallet is requesting the link.",
    );
  }

  // TODO(#509-followup): verify caller.wallet holds the workspace admin Hat
  // on-chain via the Hats contract. For MVP we trust the URL-bearer.

  await identity.upsertPlatformLink({
    provider: "discord",
    platformId: guildId,
    treeId,
    installedBy: caller.wallet,
  });

  return ephemeral(
    `✅ Linked this server to Toban workspace \`${treeId}\`. Members can now run \`/toban-setup\` and \`/thx\`.`,
  );
}
