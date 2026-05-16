import { and, eq } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { toBytes } from "viem";
import type { Hex } from "viem";
import { identities, platformLinks, usedBindingNonces } from "./schema.js";
import type {
  Identity,
  NewIdentity,
  NewPlatformLink,
  PlatformLink,
} from "./schema.js";

/**
 * Drizzle SQLite database compatible with both the D1 driver
 * (`drizzle-orm/d1`) and the local test driver (`drizzle-orm/better-sqlite3`).
 *
 * D1 is async, `better-sqlite3` is sync — Drizzle expresses this difference
 * via the `TResultKind` generic. We accept either so the same `queries.ts`
 * compiles in both contexts: tests pass a `better-sqlite3` instance and the
 * Discord bot Worker passes a D1 instance.
 */
export type IdentityDb = BaseSQLiteDatabase<
  "sync" | "async",
  unknown,
  Record<string, unknown>
>;

/** Lookup by `(provider, account_id)`. Returns `null` when no row matches. */
export async function getIdentity(
  db: IdentityDb,
  provider: string,
  accountId: string,
): Promise<Identity | null> {
  const rows = await db
    .select()
    .from(identities)
    .where(
      and(
        eq(identities.provider, provider),
        eq(identities.accountId, accountId),
      ),
    )
    .limit(1);
  return (rows[0] as Identity | undefined) ?? null;
}

/**
 * Insert or update the `(provider, account_id) → wallet` row.
 *
 * On conflict we update `wallet`, `metadata`, and `updated_at` — `created_at`
 * is preserved. This matches the semantics in issue #507: a single Web2
 * account can re-bind to a new wallet, but the original creation timestamp
 * is observable.
 */
export async function upsertIdentity(
  db: IdentityDb,
  row: NewIdentity,
): Promise<void> {
  await db
    .insert(identities)
    .values(row)
    .onConflictDoUpdate({
      target: [identities.provider, identities.accountId],
      set: {
        wallet: row.wallet,
        metadata: row.metadata,
        updatedAt: row.updatedAt,
      },
    });
}

/** Lookup by `(provider, platform_id)`. */
export async function getPlatformLink(
  db: IdentityDb,
  provider: string,
  platformId: string,
): Promise<PlatformLink | null> {
  const rows = await db
    .select()
    .from(platformLinks)
    .where(
      and(
        eq(platformLinks.provider, provider),
        eq(platformLinks.platformId, platformId),
      ),
    )
    .limit(1);
  return (rows[0] as PlatformLink | undefined) ?? null;
}

/** Insert or update a workspace ↔ external-platform link. */
export async function upsertPlatformLink(
  db: IdentityDb,
  row: NewPlatformLink,
): Promise<void> {
  await db
    .insert(platformLinks)
    .values(row)
    .onConflictDoUpdate({
      target: [platformLinks.provider, platformLinks.platformId],
      set: {
        treeId: row.treeId,
        installedBy: row.installedBy,
        metadata: row.metadata,
      },
    });
}

/** Return `true` if the nonce has already been consumed. */
export async function isNonceUsed(
  db: IdentityDb,
  nonce: Hex,
): Promise<boolean> {
  const buf = Buffer.from(toBytes(nonce));
  const rows = await db
    .select()
    .from(usedBindingNonces)
    .where(eq(usedBindingNonces.nonce, buf))
    .limit(1);
  return rows.length > 0;
}

/**
 * Record a nonce as consumed. Caller's responsibility to call this *after*
 * all validation has passed and *before* (or in the same logical step as)
 * the identity upsert. The PRIMARY KEY on `nonce` makes a concurrent reuse
 * attempt fail with a constraint violation.
 */
export async function markNonceUsed(
  db: IdentityDb,
  nonce: Hex,
  usedAt: number,
): Promise<void> {
  const buf = Buffer.from(toBytes(nonce));
  await db.insert(usedBindingNonces).values({ nonce: buf, usedAt });
}
