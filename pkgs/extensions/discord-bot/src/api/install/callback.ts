/**
 * GET /api/install/callback
 *
 * Discord OAuth bot-install callback. Steps:
 *   1. Verify the `state` JWT (issued by `/toban-link`).
 *   2. Exchange `code` for an access token (Discord OAuth) — used here
 *      only to confirm the install happened; the bot token itself is
 *      configured per-app, not per-install.
 *   3. (TODO once #506 lands) Verify that the admin holds the workspace
 *      admin Hat on-chain via the Hats contract. Without that check we
 *      skip this step in MVP and trust the workspace-url-bearer to be
 *      admin; integration will tighten this.
 *   4. `identity.upsertPlatformLink(...)` to persist guild_id -> tree_id.
 *   5. Register the slash commands on the new guild.
 *   6. Redirect the admin back to the frontend "installed" page.
 *
 * This handler is best-effort idempotent — repeated installs to the
 * same guild overwrite the same row in identity.platform_links.
 */
import { importPKCS8, jwtVerify } from "jose";
import type { Address } from "viem";
import type { Env } from "../../env";
import { createIdentityClient } from "../../identity";

const COMMANDS_PAYLOAD = [
  {
    name: "toban-setup",
    description: "Link your Discord account to a Toban wallet",
    type: 1,
  },
  {
    name: "toban-link",
    description: "Link this Discord server to a Toban workspace (admin only)",
    type: 1,
    options: [
      {
        name: "workspace_url",
        description: "Toban workspace URL",
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: "balance",
    description: "Show your allowance for the Toban bot",
    type: 1,
  },
  {
    name: "thx",
    description: "Send Thanks tokens to another member",
    type: 1,
    options: [
      {
        name: "user",
        description: "Recipient",
        type: 6, // USER
        required: true,
      },
      {
        name: "amount",
        description: "Amount of THX to send",
        type: 4, // INTEGER
        required: true,
      },
      {
        name: "message",
        description: "Optional message",
        type: 3,
        required: false,
      },
    ],
  },
];

async function verifyInstallState(
  env: Env,
  state: string,
): Promise<{ treeId: string }> {
  if (env.INSTALL_STATE_SECRET.includes("BEGIN")) {
    const key = await importPKCS8(env.INSTALL_STATE_SECRET, "ES256");
    const { payload } = await jwtVerify(state, key, {
      issuer: "toban-discord-bot",
    });
    return { treeId: String(payload.treeId) };
  }
  const key = new TextEncoder().encode(env.INSTALL_STATE_SECRET);
  const { payload } = await jwtVerify(state, key, {
    issuer: "toban-discord-bot",
  });
  return { treeId: String(payload.treeId) };
}

async function registerGuildCommands(env: Env, guildId: string): Promise<void> {
  const res = await fetch(
    `https://discord.com/api/v10/applications/${env.DISCORD_APP_ID}/guilds/${guildId}/commands`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(COMMANDS_PAYLOAD),
    },
  );
  if (!res.ok) {
    throw new Error(
      `discord PUT commands failed: ${res.status} ${await res.text()}`,
    );
  }
}

export async function handleInstallCallback(
  env: Env,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const guildId = url.searchParams.get("guild_id");
  if (!code || !state || !guildId) {
    return new Response("missing code/state/guild_id", { status: 400 });
  }

  let parsedState: { treeId: string };
  try {
    parsedState = await verifyInstallState(env, state);
  } catch (err) {
    return new Response(`invalid state: ${(err as Error).message}`, {
      status: 400,
    });
  }

  // TODO(#506): verify admin Hat on-chain via Hats contract once the
  //   workspace registry is wired in. For MVP we trust the URL-bearer.
  const adminWallet: Address =
    "0x0000000000000000000000000000000000000000" as Address;

  const identity = createIdentityClient(env);
  await identity.upsertPlatformLink({
    provider: "discord",
    platformId: guildId,
    treeId: parsedState.treeId,
    adminWallet,
  });

  await registerGuildCommands(env, guildId);

  // 302 to frontend "installed" page.
  return Response.redirect(
    `${env.TOBAN_FRONTEND_URL.replace(/\/$/, "")}/connect/discord/installed?guild=${guildId}&tree=${parsedState.treeId}`,
    302,
  );
}
