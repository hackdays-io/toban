/**
 * Drizzle queries against `@toban/mcp`'s own D1 tables.
 *
 * Same driver-agnostic shape as `@toban/identity`'s `queries.ts`: accepts
 * either a D1-backed database (Workers runtime) or a `better-sqlite3`-backed
 * one (tests), because both implement the same Drizzle SQLite query surface.
 */
import { and, eq, isNull } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { toBytes } from "viem";
import type { Hex } from "viem";
import {
  type McpToken,
  type NewMcpToken,
  mcpTokens,
  usedMcpAuthNonces,
} from "./schema.js";

export type McpDb = BaseSQLiteDatabase<
  "sync" | "async",
  unknown,
  Record<string, unknown>
>;

/** Insert a freshly-issued token row. */
export async function insertToken(db: McpDb, row: NewMcpToken): Promise<void> {
  await db.insert(mcpTokens).values(row);
}

/**
 * Look up one token by id, regardless of revocation state — callers decide
 * what "revoked" means for their purpose (auth.ts refuses it; the list
 * endpoint still needs to show it).
 */
export async function getToken(
  db: McpDb,
  tokenId: string,
): Promise<McpToken | null> {
  const rows = await db
    .select()
    .from(mcpTokens)
    .where(eq(mcpTokens.tokenId, tokenId))
    .limit(1);
  return (rows[0] as McpToken | undefined) ?? null;
}

/** Every token issued for one workspace, newest first — for the settings page's list. */
export async function listTokensByTree(
  db: McpDb,
  treeId: string,
): Promise<McpToken[]> {
  const rows = await db
    .select()
    .from(mcpTokens)
    .where(eq(mcpTokens.treeId, treeId));
  return (rows as McpToken[]).sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Mark a token revoked. No-op (but not an error) if it was already revoked —
 * revocation is a one-way latch, not a toggle.
 */
export async function revokeToken(
  db: McpDb,
  tokenId: string,
  revokedAt: number,
): Promise<void> {
  await db
    .update(mcpTokens)
    .set({ revokedAt })
    .where(and(eq(mcpTokens.tokenId, tokenId), isNull(mcpTokens.revokedAt)));
}

/** Return `true` if the EIP-712 auth nonce has already been consumed. */
export async function isAuthNonceUsed(db: McpDb, nonce: Hex): Promise<boolean> {
  const buf = Buffer.from(toBytes(nonce));
  const rows = await db
    .select()
    .from(usedMcpAuthNonces)
    .where(eq(usedMcpAuthNonces.nonce, buf))
    .limit(1);
  return rows.length > 0;
}

/**
 * Record an auth nonce as consumed. The PRIMARY KEY on `nonce` makes a
 * concurrent replay fail with a constraint violation — same pattern as
 * `@toban/identity`'s `markNonceUsed`.
 */
export async function markAuthNonceUsed(
  db: McpDb,
  nonce: Hex,
  usedAt: number,
): Promise<void> {
  const buf = Buffer.from(toBytes(nonce));
  await db.insert(usedMcpAuthNonces).values({ nonce: buf, usedAt });
}
