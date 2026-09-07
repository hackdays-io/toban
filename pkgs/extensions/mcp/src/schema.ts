import {
  blob,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * The `tbn2` token registry.
 *
 * The plaintext token is never stored — it is reconstructible from
 * `(treeId, tokenId)` plus `MCP_TOKEN_SECRET` (see `auth.ts`), so storing it
 * would only be a second copy of a secret. This table exists purely to make
 * revocation possible: `auth.ts` verifies the MAC statelessly first (cheap,
 * no D1 hit for garbage tokens) and only then looks up `tokenId` here to
 * confirm it hasn't been revoked.
 */
export const mcpTokens = sqliteTable(
  "mcp_tokens",
  {
    tokenId: text("token_id").primaryKey(),
    treeId: text("tree_id").notNull(),
    label: text("label").notNull(),
    /** Wallet that requested the token (EIP-712 signer, see verify.ts). */
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at").notNull(),
    /** NULL means still valid. Set once, never cleared. */
    revokedAt: integer("revoked_at"),
  },
  (table) => ({
    treeIdx: index("idx_mcp_tokens_tree").on(table.treeId),
  }),
);

/**
 * Consumed nonces for the `McpTokenIssueRequest` / `McpTokenRevokeRequest`
 * EIP-712 messages (see `eip712/mcp-token.ts`) — listing's
 * `McpTokenListRequest` is deliberately not tracked here; its nonce is never
 * burned. Mirrors
 * `@toban/identity`'s `used_binding_nonces` table exactly, but lives here:
 * each Worker owns its own replay-protection table rather than sharing one
 * across packages (see CLAUDE.md — "Worker ごとに自分のテーブルを所有").
 */
export const usedMcpAuthNonces = sqliteTable("used_mcp_auth_nonces", {
  nonce: blob("nonce", { mode: "buffer" }).primaryKey(),
  usedAt: integer("used_at").notNull(),
});

export type McpToken = typeof mcpTokens.$inferSelect;
export type NewMcpToken = typeof mcpTokens.$inferInsert;
export type UsedMcpAuthNonce = typeof usedMcpAuthNonces.$inferSelect;
