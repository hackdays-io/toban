/**
 * Register the bot's slash commands at a specific Discord guild (instant
 * propagation — global commands take up to ~1h to appear).
 *
 * Reads DISCORD_APP_ID and DISCORD_BOT_TOKEN from env; takes the guild id
 * as positional argv. Re-running with the same guild PUTs an idempotent
 * replacement of the command set (overwrites previous registrations).
 *
 * The command definitions live in `src/commands/payload.ts` so this script
 * and the frontend-initiated install flow (`src/api/install/callback.ts`)
 * always register the identical set.
 *
 * Usage:
 *   read -p "App ID: " DISCORD_APP_ID
 *   read -s -p "Bot Token: " DISCORD_BOT_TOKEN; echo
 *   DISCORD_APP_ID=$DISCORD_APP_ID DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN \
 *     pnpm --filter @toban/discord-bot register-commands <guild-id>
 */
import { COMMANDS_PAYLOAD } from "../src/commands/payload";

const APP_ID = process.env.DISCORD_APP_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.argv[2];

if (!APP_ID || !BOT_TOKEN) {
  console.error("DISCORD_APP_ID and DISCORD_BOT_TOKEN env vars are required.");
  process.exit(1);
}
if (!GUILD_ID) {
  console.error(
    "Usage: register-commands <guild-id>\n" +
      "Enable Developer Mode in Discord, right-click the guild, 'Copy Server ID'.",
  );
  process.exit(1);
}

const commands = COMMANDS_PAYLOAD;

const url = `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`;

const res = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(commands),
});

if (!res.ok) {
  console.error(`Discord API returned ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

const body = (await res.json()) as Array<{ id: string; name: string }>;
console.log(`Registered ${body.length} commands on guild ${GUILD_ID}:`);
for (const c of body) {
  console.log(`  - /${c.name}  (id: ${c.id})`);
}
