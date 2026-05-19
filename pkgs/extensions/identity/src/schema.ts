import {
  blob,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/**
 * Web2 account ↔ wallet binding.
 *
 * `(provider, account_id)` is the unique identity key. `wallet` is stored as a
 * checksum (mixed-case) address so we don't accidentally lose the case bits.
 * `metadata` is provider-specific JSON (e.g. `{ username, avatar }`) serialised
 * to a string.
 */
export const identities = sqliteTable(
  "identities",
  {
    provider: text("provider").notNull(),
    accountId: text("account_id").notNull(),
    wallet: text("wallet").notNull(),
    metadata: text("metadata"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.accountId] }),
    walletIdx: index("idx_identities_wallet").on(table.wallet),
  }),
);

/**
 * Workspace ↔ external-platform link (Discord guild / Slack team / GitHub org).
 *
 * `tree_id` is the Hats tree id of the Toban workspace. `installed_by` is the
 * admin wallet that performed the install.
 */
export const platformLinks = sqliteTable(
  "platform_links",
  {
    provider: text("provider").notNull(),
    platformId: text("platform_id").notNull(),
    treeId: text("tree_id").notNull(),
    installedBy: text("installed_by").notNull(),
    metadata: text("metadata"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.provider, table.platformId] }),
    treeIdx: index("idx_platform_links_tree").on(table.treeId),
  }),
);

/**
 * Consumed `IdentityBinding` nonces — single-use replay protection.
 *
 * `nonce` is the raw 32-byte `bytes32` field from the EIP-712 message, stored
 * as a BLOB. `used_at` is unix seconds for housekeeping/observability.
 */
export const usedBindingNonces = sqliteTable("used_binding_nonces", {
  nonce: blob("nonce", { mode: "buffer" }).primaryKey(),
  usedAt: integer("used_at").notNull(),
});

export type Identity = typeof identities.$inferSelect;
export type NewIdentity = typeof identities.$inferInsert;
export type PlatformLink = typeof platformLinks.$inferSelect;
export type NewPlatformLink = typeof platformLinks.$inferInsert;
export type UsedBindingNonce = typeof usedBindingNonces.$inferSelect;
