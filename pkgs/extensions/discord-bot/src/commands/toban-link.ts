/**
 * /toban-link <workspace_url>
 *
 * Discord-initiated workspace binding. Resolves the workspace tree id
 * from the URL, looks up the caller's wallet via identity, confirms the
 * caller wears any Hat in the workspace tree (member-level gate, not
 * admin-only — issue #509 decision: admin-only is too friction-heavy
 * for the MVP flow), then upserts the
 * (provider=discord, platform_id=guild_id) → tree_id binding via the
 * identity Worker.
 *
 * The OAuth callback handler (`api/install/callback.ts`) is the
 * frontend-initiated equivalent and shares the same identity boundary.
 *
 * Hardening relative to the initial spec:
 *   - URL host must match `TOBAN_FRONTEND_URL` (no open-host parsing).
 *   - Caller's identity-bound wallet must wear ≥1 hat in the target tree.
 *     Looked up via the Hats subgraph (see `wearsAnyHatInTree`).
 */
import type {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";
import type { Address } from "viem";
import { wearsAnyHatInTree } from "../chain";
import type { Env } from "../env";
import { type IdentityClient, createIdentityClient } from "../identity";
import { ephemeral } from "./responses";

function normalizeHost(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Parse a workspace URL into its tree id, enforcing that the host
 * matches one of `allowedHosts`. Returns `null` for any shape that does
 * not look like `https://<allowed-host>/<treeId>[/...]`.
 */
function extractTreeId(
  workspaceUrl: string,
  allowedHosts: ReadonlySet<string>,
): string | null {
  let u: URL;
  try {
    u = new URL(workspaceUrl);
  } catch {
    return null;
  }
  if (!allowedHosts.has(u.host.toLowerCase())) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const treeId = parts[0];
  if (!/^[0-9a-fA-Fx]+$/.test(treeId)) return null;
  return treeId;
}

export interface TobanLinkDeps {
  identity?: IdentityClient;
  /**
   * Verify the caller's wallet is a member of the target workspace
   * tree. Defaults to a Hats subgraph fetch — tests stub.
   */
  wearsHatInTree?: (wallet: Address, treeId: string) => Promise<boolean>;
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
  const frontendHost = normalizeHost(env.TOBAN_FRONTEND_URL);
  if (!frontendHost) {
    return ephemeral(
      "The bot is misconfigured: TOBAN_FRONTEND_URL is not a valid URL. Please contact an operator.",
    );
  }
  const allowedHosts = new Set<string>([frontendHost]);
  const treeId = extractTreeId(workspaceUrl, allowedHosts);
  if (!treeId) {
    return ephemeral(
      `Workspace URL must start with ${env.TOBAN_FRONTEND_URL} and include a tree id, e.g. ${env.TOBAN_FRONTEND_URL.replace(/\/$/, "")}/<treeId>`,
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

  const wearsHat =
    deps.wearsHatInTree ??
    ((wallet: Address, t: string) => wearsAnyHatInTree(env, wallet, t));
  let isMember: boolean;
  try {
    isMember = await wearsHat(caller.wallet as Address, treeId);
  } catch (err) {
    return ephemeral(
      `Could not verify workspace membership right now (${(err as Error).message}). Try again in a moment.`,
    );
  }
  if (!isMember) {
    return ephemeral(
      "Your linked wallet doesn't wear any hat in this workspace. Only members of the workspace can link a Discord server to it.",
    );
  }

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
