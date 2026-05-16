/**
 * /toban-link <workspace_url>
 *
 * Admin command. The actual install-time binding work happens in the
 * OAuth callback at `/api/install/callback` (see api/install/callback.ts)
 * — this slash command is the in-Discord entry point that hands the
 * admin off to the install URL.
 *
 * We keep this stateless here: build a state JWT with the workspace
 * tree_id and admin's claimed wallet (resolved later in the callback
 * via identity worker), then return an ephemeral message with the
 * Discord bot-install URL pre-filled with the right `state`.
 */
import type {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";
import { SignJWT, importPKCS8 } from "jose";
import type { Env } from "../env";
import { ephemeral } from "./responses";

const INSTALL_TTL_SECONDS = 10 * 60;

function extractTreeId(workspaceUrl: string): string | null {
  try {
    const u = new URL(workspaceUrl);
    // Frontend route: `/<treeId>` or `/<treeId>/...`
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const treeId = parts[0];
    if (!/^[0-9a-fA-Fx]+$/.test(treeId)) return null;
    return treeId;
  } catch {
    return null;
  }
}

/**
 * Sign the install-state JWT. We use HS256 (not ES256) because the same
 * Worker that mints the state verifies it — no third party reads it.
 *
 * `INSTALL_STATE_SECRET` may be a plain symmetric secret (HS256 path,
 * used by default) or, in the future, a PEM PKCS8 private key for ES256
 * if we decide the install URL should be inspected by a separate party.
 */
async function signInstallState(
  env: Env,
  payload: { treeId: string; guildHint?: string },
): Promise<string> {
  // Detect if INSTALL_STATE_SECRET is a PEM block; otherwise treat as HS256 key.
  if (env.INSTALL_STATE_SECRET.includes("BEGIN")) {
    const key = await importPKCS8(env.INSTALL_STATE_SECRET, "ES256");
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "ES256" })
      .setIssuer("toban-discord-bot")
      .setIssuedAt()
      .setExpirationTime(`${INSTALL_TTL_SECONDS}s`)
      .sign(key);
  }
  const key = new TextEncoder().encode(env.INSTALL_STATE_SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("toban-discord-bot")
    .setIssuedAt()
    .setExpirationTime(`${INSTALL_TTL_SECONDS}s`)
    .sign(key);
}

export async function handleTobanLink(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
): Promise<APIInteractionResponse> {
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
  const state = await signInstallState(env, {
    treeId,
    guildHint: interaction.guild_id,
  });
  const installUrl = new URL("https://discord.com/oauth2/authorize");
  installUrl.searchParams.set("client_id", env.DISCORD_APP_ID);
  installUrl.searchParams.set("scope", "bot applications.commands");
  installUrl.searchParams.set("permissions", "0");
  installUrl.searchParams.set("state", state);
  installUrl.searchParams.set(
    "redirect_uri",
    `${env.TOBAN_FRONTEND_URL.replace(/\/$/, "")}/connect/discord/installed`,
  );
  return ephemeral(
    `Install the Toban bot into a server and link it to workspace \`${treeId}\`:\n${installUrl.toString()}`,
  );
}
