/**
 * GET /api/install/callback
 *
 * Discord OAuth bot-install callback for the frontend-initiated install
 * flow ("Connect Discord" button on a workspace page). Steps:
 *   1. Verify the install-state JWT (issued by the frontend with
 *      `{ treeId, guild_id, jti }` claims and a pinned algorithm).
 *   2. Confirm the URL's `guild_id` matches the state JWT's `guild_id`.
 *   3. Single-use claim the JWT's `jti` so the state cannot replay.
 *   4. Exchange the OAuth `code` against Discord's token endpoint and
 *      confirm Discord returns the same `guild.id` we're binding to.
 *   5. `identity.upsertPlatformLink(...)` to persist guild_id -> tree_id.
 *   6. Register the slash commands on the new guild.
 *   7. Redirect the admin back to the workspace allowance page.
 *
 * Discord-initiated installs (admin runs `/toban-link <workspace_url>`
 * in an already-invited server) bypass this handler and bind directly
 * — see `commands/toban-link.ts`.
 *
 * Idempotent — repeated installs to the same guild overwrite the same
 * row in `platform_links`. Replays of the *same* state JWT are blocked
 * by the jti claim.
 */
import { importPKCS8, jwtVerify } from "jose";
import type { Address } from "viem";
import type { Env } from "../../env";
import { type IdentityClient, createIdentityClient } from "../../identity";

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

const VALID_TREE_ID = /^[0-9]+$/;

interface InstallStateClaims {
  treeId: string;
  guildId: string;
  jti: string;
}

/**
 * Verify and parse the install-state JWT. Returns the structured claims
 * or throws. Algorithm is pinned per finding #4(c).
 *
 * Two key formats supported because deployment hasn't settled on one:
 *   - PEM PKCS8 ES256 (asymmetric — preferred for prod so secret rotation
 *     doesn't require updating every Worker that verifies)
 *   - Raw HMAC string (HS256 — convenient for dev / single-Worker setups)
 */
async function verifyInstallState(
  env: Env,
  state: string,
): Promise<InstallStateClaims> {
  const isPem = env.INSTALL_STATE_SECRET.includes("BEGIN");
  const key = isPem
    ? await importPKCS8(env.INSTALL_STATE_SECRET, "ES256")
    : new TextEncoder().encode(env.INSTALL_STATE_SECRET);
  const { payload } = await jwtVerify(state, key, {
    issuer: "toban-discord-bot",
    algorithms: [isPem ? "ES256" : "HS256"],
    requiredClaims: ["jti"],
  });
  const treeId = payload.treeId;
  const guildId = payload.guild_id ?? payload.guildId;
  const jti = payload.jti;
  if (typeof treeId !== "string" || !VALID_TREE_ID.test(treeId)) {
    throw new Error("state.treeId is not a decimal tree id");
  }
  if (typeof guildId !== "string" || guildId.length === 0) {
    throw new Error("state.guild_id is missing");
  }
  if (typeof jti !== "string" || jti.length === 0) {
    throw new Error("state.jti is missing");
  }
  return { treeId, guildId, jti };
}

interface OAuthExchangeResult {
  guildId: string;
}

/**
 * Exchange the OAuth `code` against Discord's token endpoint. Discord
 * returns the granted bot's `guild` object — we read its id to confirm
 * the install actually landed on the guild we're about to bind. Any
 * status ≠ 200, JSON shape mismatch, or guild id mismatch is treated as
 * a hard failure to keep the surface tight.
 */
async function exchangeDiscordCode(
  env: Env,
  code: string,
  fetchImpl: typeof fetch,
): Promise<OAuthExchangeResult> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_APP_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: `${env.BOT_WORKER_URL.replace(/\/$/, "")}/api/install/callback`,
  });
  const res = await fetchImpl("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(
      `discord token exchange failed: ${res.status} ${await res.text()}`,
    );
  }
  const json = (await res.json()) as { guild?: { id?: string } | null };
  const id = json.guild?.id;
  if (typeof id !== "string" || id.length === 0) {
    throw new Error(
      "discord token exchange response missing guild.id (bot install flow expects a guild grant)",
    );
  }
  return { guildId: id };
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

export interface InstallCallbackDeps {
  identity?: IdentityClient;
  /** Injectable for tests so we can fake Discord's OAuth endpoint. */
  exchangeCode?: (env: Env, code: string) => Promise<OAuthExchangeResult>;
}

export async function handleInstallCallback(
  env: Env,
  request: Request,
  deps: InstallCallbackDeps = {},
): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const guildId = url.searchParams.get("guild_id");
  if (!code || !state || !guildId) {
    return new Response("missing code/state/guild_id", { status: 400 });
  }

  let parsedState: InstallStateClaims;
  try {
    parsedState = await verifyInstallState(env, state);
  } catch (err) {
    return new Response(`invalid state: ${(err as Error).message}`, {
      status: 400,
    });
  }

  // The JWT bound itself to a specific guild — refuse to bind anywhere
  // else, even if Discord redirected with a guild_id of the attacker's
  // choosing.
  if (parsedState.guildId !== guildId) {
    return new Response("guild_id does not match state", { status: 400 });
  }

  const identity = deps.identity ?? createIdentityClient(env);

  // Single-use claim — replays of the same JWT now produce 409 here
  // before any side effect.
  const claim = await identity.claimInstallStateJti(parsedState.jti);
  if (!claim.ok) {
    return new Response("install state already used", { status: 409 });
  }

  // Exchange the `code` against Discord so we know the install actually
  // happened, and confirm Discord agrees on the guild we're binding to.
  const exchange =
    deps.exchangeCode ?? ((e, c) => exchangeDiscordCode(e, c, fetch));
  let exchangeResult: OAuthExchangeResult;
  try {
    exchangeResult = await exchange(env, code);
  } catch (err) {
    return new Response(`oauth exchange failed: ${(err as Error).message}`, {
      status: 400,
    });
  }
  if (exchangeResult.guildId !== guildId) {
    return new Response(
      "discord granted bot install on a different guild than requested",
      { status: 400 },
    );
  }

  // TODO: verify the admin's wallet holds the workspace admin Hat via the
  //   Hats contract. The frontend-initiated flow doesn't know the admin's
  //   wallet without a separate identity binding step; for MVP we record
  //   the zero sentinel. /toban-link (Discord-initiated) does this
  //   already by reading the caller's identity-bound wallet.
  const installedBy: Address =
    "0x0000000000000000000000000000000000000000" as Address;

  await identity.upsertPlatformLink({
    provider: "discord",
    platformId: guildId,
    treeId: parsedState.treeId,
    installedBy,
  });

  await registerGuildCommands(env, guildId);

  return new Response(null, {
    status: 302,
    headers: {
      location: `${env.TOBAN_FRONTEND_URL.replace(/\/$/, "")}/${parsedState.treeId}/discord-bot`,
      // Strip Referer on the redirect so the OAuth state/code aren't
      // leaked downstream.
      "referrer-policy": "no-referrer",
    },
  });
}
