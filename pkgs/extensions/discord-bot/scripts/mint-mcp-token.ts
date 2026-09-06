#!/usr/bin/env tsx
/**
 * Mint the MCP bearer token for one Discord guild.
 *
 *   MCP_TOKEN_SECRET=... pnpm discord-bot mint-mcp-token <guildId>
 *
 * Hand the printed token to whoever runs the agent for that server. It only
 * grants "act for this guild", and every write it can reach still stops at a
 * confirm button, so it is not a signing credential — but it does allow
 * reading the workspace and posting proposals, so treat it as a password.
 *
 * The secret must match the Worker's `MCP_TOKEN_SECRET`:
 *   pnpm --filter @toban/discord-bot exec wrangler secret put MCP_TOKEN_SECRET --env base
 */
import { issueGuildToken } from "../src/mcp/auth";

const guildId = process.argv[2];
const secret = process.env.MCP_TOKEN_SECRET;

if (!guildId) {
  console.error("usage: mint-mcp-token <guildId>");
  process.exit(1);
}
if (!secret) {
  console.error("MCP_TOKEN_SECRET is not set");
  process.exit(1);
}

issueGuildToken(secret, guildId).then(
  (token) => {
    console.log(token);
  },
  (err: Error) => {
    console.error(err.message);
    process.exit(1);
  },
);
