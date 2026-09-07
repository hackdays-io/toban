#!/usr/bin/env tsx
/**
 * Operator escape hatch: mint an MCP token without going through the
 * self-service `/api/mcp-tokens` flow (`docs/mcp-extraction.md` §5).
 *
 * Use this when the frontend is down, or when issuing a token to someone who
 * does not yet hold the workspace's operator/top hat (self-service always
 * checks that). It is NOT the primary path — point people at
 * `/$treeId/settings` first.
 *
 *   MCP_TOKEN_SECRET=... pnpm mcp mint-mcp-token <treeId> <label> [--env base]
 *
 * This writes the registry row itself (via `wrangler d1 execute --remote`)
 * as well as printing the bearer token, because the two-stage `tbn2` design
 * means a MAC alone is not enough — `auth.ts` also looks the tokenId up in
 * `mcp_tokens` (see that file's module doc for why). A token minted here
 * without the matching row would fail every request with "unknown token".
 */
import { execFileSync } from "node:child_process";
import { generateTokenId, issueToken } from "../src/auth";

const treeId = process.argv[2];
const label = process.argv[3];
const envFlagIndex = process.argv.indexOf("--env");
const targetEnv =
  envFlagIndex !== -1 ? process.argv[envFlagIndex + 1] : undefined;
const secret = process.env.MCP_TOKEN_SECRET;

if (!treeId || !/^\d+$/.test(treeId)) {
  console.error("usage: mint-mcp-token <treeId> <label> [--env base]");
  process.exit(1);
}
if (!label) {
  console.error("usage: mint-mcp-token <treeId> <label> [--env base]");
  process.exit(1);
}
if (!secret) {
  console.error("MCP_TOKEN_SECRET is not set");
  process.exit(1);
}
if (targetEnv !== undefined && targetEnv !== "base") {
  console.error('only "--env base" is supported (omit --env for sepolia)');
  process.exit(1);
}

const dbName = targetEnv === "base" ? "toban-identity-base" : "toban-identity";
const createdBy = "operator-cli";
const createdAt = Math.floor(Date.now() / 1000);

async function main() {
  const tokenId = generateTokenId();
  const token = await issueToken(secret as string, treeId, tokenId);

  const escapedLabel = label.replace(/'/g, "''");
  const sql = `INSERT INTO mcp_tokens (token_id, tree_id, label, created_by, created_at, revoked_at) VALUES ('${tokenId}', '${treeId}', '${escapedLabel}', '${createdBy}', ${createdAt}, NULL);`;

  const args = ["d1", "execute", dbName, "--remote", `--command=${sql}`];
  if (targetEnv === "base") args.push("--env", "base");

  console.error(
    `writing registry row to ${dbName}${targetEnv === "base" ? " (base)" : ""}...`,
  );
  execFileSync("pnpm", ["exec", "wrangler", ...args], { stdio: "inherit" });

  console.log(token);
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
