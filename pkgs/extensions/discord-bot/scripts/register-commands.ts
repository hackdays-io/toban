/**
 * Register the bot's slash commands at a specific Discord guild (instant
 * propagation — global commands take up to ~1h to appear).
 *
 * Reads DISCORD_APP_ID and DISCORD_BOT_TOKEN from env; takes the guild id
 * as positional argv. Re-running with the same guild PUTs an idempotent
 * replacement of the command set (overwrites previous registrations).
 *
 * Usage:
 *   read -p "App ID: " DISCORD_APP_ID
 *   read -s -p "Bot Token: " DISCORD_BOT_TOKEN; echo
 *   DISCORD_APP_ID=$DISCORD_APP_ID DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN \
 *     pnpm --filter @toban/discord-bot register-commands <guild-id>
 */
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

// Type 1 = CHAT_INPUT (slash). Option types: 3=STRING, 4=INTEGER, 6=USER.
const commands = [
  {
    name: "toban-setup",
    description: "Issue a link to connect your wallet to your Discord account",
    type: 1,
  },
  {
    name: "toban-link",
    description: "(admin) Link this server to a Toban workspace",
    type: 1,
    options: [
      {
        name: "workspace_url",
        description: "Toban workspace URL (e.g. https://toban.xyz/3002)",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "thx",
    description: "Send THX to another member",
    type: 1,
    options: [
      { name: "user", description: "Recipient", type: 6, required: true },
      {
        name: "amount",
        description: "Amount of THX (positive integer)",
        type: 4,
        required: true,
        min_value: 1,
      },
      {
        name: "message",
        description: "Optional thank-you note",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "balance",
    description: "Show your mintAllowance and mintable budget",
    type: 1,
  },
];

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
