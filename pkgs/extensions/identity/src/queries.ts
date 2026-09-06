import { and, eq, inArray } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { getAddress, toBytes } from "viem";
import type { Hex } from "viem";
import {
  identities,
  platformLinks,
  usedBindingNonces,
  usedInstallStateJtis,
} from "./schema.js";
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
 * D1 は 1 クエリあたりのバインド変数を 100 個までしか受け付けない。
 * `provider` 分を 1 つ使うので、IN 句に詰めるアドレスは余裕を見て 90 件で区切る。
 */
const WALLET_IN_CHUNK_SIZE = 90;

/**
 * ウォレットアドレスを EIP-55 の checksum 表記に正規化する。
 *
 * ## なぜ正規化が必要か（本モジュールで一番の罠）
 *
 * `identities.wallet` は **checksum（mixed-case）** で保存されている。
 * （`handlers/connect.ts` が upsert 直前に `getAddress()` を通している。）
 * 一方、逆引きの呼び出し元である通知処理は subgraph からアドレスを得るが、
 * subgraph は `Address.toHex()` の結果、つまり **全小文字** を返す。
 * SQLite / D1 の `=` は TEXT に対して大文字小文字を区別するので、
 * 小文字のまま素直に比較すると **必ず 0 件になる**。
 *
 * ## なぜ「クエリ側で checksum 化」を選んだか
 *
 * - **既存データを壊さない**。保存形式（checksum）を変えないのでデータ移行が不要で、
 *   順方向 `/api/lookup` のレスポンス（checksum を返す）とも矛盾しない。
 * - **`idx_identities_wallet` がそのまま効く**。`lower(wallet) = ?` や
 *   `COLLATE NOCASE` にすると、`identities(wallet)` の素の B-tree インデックスは
 *   使われず全件スキャンになる（式インデックスを別途張る必要がある）。
 * - `getAddress()` は EIP-55 の唯一の正規形を返すので、呼び出し元が全小文字で渡そうが
 *   全大文字で渡そうが、常に同じキーに寄る。
 *
 * `getAddress()` に mixed-case をそのまま渡すと EIP-55 チェックサム検証が走り、
 * 「大文字小文字が雑なだけの正しいアドレス」でも throw する。逆引きの入力は
 * 外部（subgraph / automation）由来で表記が保証できないので、いったん全小文字に
 * 落としてから checksum 化し、**16 進として正しければどんな表記でも受け入れる**。
 * 16 進として壊れている文字列に対しては throw するので、呼び出し元（ハンドラ）で
 * `isAddress(x, { strict: false })` を使って事前に弾くこと。
 */
export function normalizeWallet(wallet: string): string {
  return getAddress(wallet.toLowerCase());
}

/**
 * 逆引き: `(provider, wallet) → identities[]`。
 *
 * `identities` の PK は `(provider, account_id)` なので、1 つのウォレットに
 * 複数のアカウントが紐づき得る（例: 主アカウントとサブアカウント）。
 * よって常に配列で返す。未連携はエラーではなく空配列。
 *
 * 大文字小文字の扱いは {@link normalizeWallet} のコメントを参照。
 */
export async function getIdentitiesByWallet(
  db: IdentityDb,
  provider: string,
  wallet: string,
): Promise<Identity[]> {
  const rows = await db
    .select()
    .from(identities)
    .where(
      and(
        eq(identities.provider, provider),
        eq(identities.wallet, normalizeWallet(wallet)),
      ),
    );
  return rows as Identity[];
}

/**
 * 逆引きのバッチ版。通知処理は 1 回の実行で数十件のアドレスを引くので、
 * 1 件ずつ SELECT を投げると D1 のラウンドトリップが積み上がる。
 *
 * 入力は重複除去してから `IN` 句に詰める。`IN` も等値比較の集まりなので
 * `idx_identities_wallet` が効く。戻り値はフラットな行の配列で、
 * ウォレットごとのグルーピングはハンドラ側の責任。
 */
export async function getIdentitiesByWallets(
  db: IdentityDb,
  provider: string,
  wallets: readonly string[],
): Promise<Identity[]> {
  const checksums = [...new Set(wallets.map(normalizeWallet))];
  const out: Identity[] = [];
  for (let i = 0; i < checksums.length; i += WALLET_IN_CHUNK_SIZE) {
    const chunk = checksums.slice(i, i + WALLET_IN_CHUNK_SIZE);
    const rows = await db
      .select()
      .from(identities)
      .where(
        and(
          eq(identities.provider, provider),
          inArray(identities.wallet, chunk),
        ),
      );
    out.push(...(rows as Identity[]));
  }
  return out;
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

/**
 * Claim an OAuth-install state-JWT `jti` for single-use semantics.
 *
 * On first call for a given `jti`, inserts the row and resolves. On any
 * subsequent call with the same `jti`, the PRIMARY KEY constraint
 * causes the insert to throw — the caller MUST treat the throw as
 * "jti already used" and reject the install attempt without side
 * effects.
 *
 * Caller is responsible for inspecting the error to distinguish PK
 * violations from transient D1 errors (see the connect handler's
 * `markNonceUsed` flow for the analogous treatment).
 */
export async function claimInstallStateJti(
  db: IdentityDb,
  jti: string,
  usedAt: number,
): Promise<void> {
  await db.insert(usedInstallStateJtis).values({ jti, usedAt });
}
