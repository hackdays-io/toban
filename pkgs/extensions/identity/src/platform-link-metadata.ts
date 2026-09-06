/**
 * `platform_links.metadata` に入れる JSON の共有スキーマ。
 *
 * このカラムは 1 つの機能の持ち物ではない。#575（通知チャンネル）に続いて
 * #577（MCP トークンの guild 単位失効）も同じカラムを使う予定なので、
 * 「誰がどのキーを持つか」をここで一度だけ決めておく。
 *
 * ## 形
 *
 * ```jsonc
 * {
 *   "v": 1,                         // スキーマバージョン（単調増加の整数）
 *   "notify": { "channelId": "…" }, // #575 が所有
 *   "mcp":    { "tokenVersion": 1 } // #577 が所有（予定）
 * }
 * ```
 *
 * ## 決めたこと と その理由
 *
 * 1. **トップレベルは機能ごとの名前空間オブジェクトにする**（`notifyChannelId`
 *    のようなフラットなキーにしない）。フラットだと機能が増えるたびにキー名の
 *    衝突を人間の注意力で避けることになるし、「この機能が触ってよいキー」の
 *    範囲がコードから読めない。名前空間なら部分更新の単位がサブツリーになり、
 *    {@link mergePlatformLinkMetadata} の再帰マージがそのまま所有権の境界になる。
 * 2. **`v` はオブジェクト全体に 1 つだけ持つ**。名前空間ごとにバージョンを
 *    持たせると読み出し側が N 個の分岐を抱える。今のところ後方互換な追加しか
 *    予定していないので、`v` は「非互換な作り替えをしたとき」にだけ上げる。
 *    読み出し側は未知の `v` でも既知のキーだけを見て動くこと（この実装もそう）。
 * 3. **キーの追加は破壊的変更にしない**。書き込みは必ず
 *    {@link mergePlatformLinkMetadata} を通す read-modify-write にして、
 *    知らないキーは素通しで保存する。素朴に上書きすると、後から入る機能の値が
 *    別機能の書き込みで消える。
 * 4. **専用テーブルには切り出さない**（今は）。`platform_links` は
 *    `(provider, platform_id)` で 1 行しかなく、通知チャンネルも MCP トークン
 *    バージョンもその 1 行に対する属性なので、JOIN が要る形にする理由がない。
 *    設定項目が「一覧・検索したくなる」規模になったら切り出す。
 *
 * ## 新しい名前空間を足すときの作法
 *
 * - 名前空間名（`notify` / `mcp` / …）とその型をこのファイルに足す。
 * - 値のバリデーションは名前空間の所有者が書く。汎用の metadata PATCH
 *   エンドポイントは**用意しない**（何でも入る書き込み口はバリデーションの
 *   持ち主が居なくなるため）。`handlePlatformLinkNotifyChannel` を真似て
 *   専用ルートを 1 本足し、{@link mergePlatformLinkMetadata} を共有する。
 * - 既存キーの意味を変えたくなったら `v` を上げ、読み出し側に移行を書く。
 */

/**
 * Discord snowflake（64bit 符号なし整数の 10 進表記）。
 *
 * 桁数は Discord epoch 以降のタイムスタンプから決まるので実運用では 17〜19 桁。
 * 将来の桁溢れに備えて 20 桁まで許容し、先頭 0 は弾く。`<#123>` のような
 * メンション記法や空文字はここで落ちる。
 */
const SNOWFLAKE_RE = /^[1-9]\d{16,19}$/;

/** 値が Discord snowflake の形をしているか。 */
export function isSnowflake(value: unknown): value is string {
  return typeof value === "string" && SNOWFLAKE_RE.test(value);
}

/** 現在のスキーマバージョン。非互換な作り替えのときだけ上げる。 */
export const PLATFORM_LINK_METADATA_VERSION = 1;

/** #575 が所有する名前空間。 */
export type NotifyMetadata = {
  /** 通知の投稿先チャンネル（Discord snowflake）。未設定なら不在。 */
  channelId?: string;
};

/**
 * `platform_links.metadata` の型。
 *
 * インデックスシグネチャを持つのは意図的で、**まだこのファイルが知らない
 * 名前空間を型レベルでも捨てない**ことを表している。
 */
export type PlatformLinkMetadata = {
  /** スキーマバージョン。 */
  v?: number;
  notify?: NotifyMetadata;
} & Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * DB の `metadata` カラム（JSON 文字列 or NULL）をオブジェクトに戻す。
 *
 * 壊れた JSON やオブジェクト以外の JSON は `{}` として扱う。ここで throw
 * すると 1 行の破損が読み取り経路全体を止めてしまうため。
 */
export function parsePlatformLinkMetadata(
  raw: string | null | undefined,
): PlatformLinkMetadata {
  if (raw === null || raw === undefined || raw === "") return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  return isPlainObject(parsed) ? (parsed as PlatformLinkMetadata) : {};
}

/**
 * 部分更新のためのマージ。**これを通さずに metadata を上書きしないこと。**
 *
 * - プレーンオブジェクト同士は再帰的にマージする（他の名前空間を残す）
 * - `undefined` を値に持つキーは「削除」を意味する
 * - 配列・スカラーは置き換え（部分的な配列マージは意味が決まらないため）
 */
export function mergePlatformLinkMetadata(
  base: PlatformLinkMetadata,
  patch: PlatformLinkMetadata,
): PlatformLinkMetadata {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) {
      delete out[key];
      continue;
    }
    const current = out[key];
    out[key] =
      isPlainObject(current) && isPlainObject(value)
        ? mergePlatformLinkMetadata(
            current as PlatformLinkMetadata,
            value as PlatformLinkMetadata,
          )
        : value;
  }
  return out as PlatformLinkMetadata;
}

/** 空になった名前空間オブジェクトを再帰的に落とす。 */
function prune(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v === undefined) continue;
    if (isPlainObject(v)) {
      const child = prune(v);
      if (Object.keys(child).length > 0) out[key] = child;
      continue;
    }
    out[key] = v;
  }
  return out;
}

/**
 * 保存用の文字列に落とす。
 *
 * 空になった名前空間は落とし、中身が `v` しか残らなければ NULL を返す。
 * 「全部の設定が消された」状態を `{"v":1}` という意味の無い行として
 * 残さないため（未設定 == NULL を保つ）。
 */
export function serializePlatformLinkMetadata(
  metadata: PlatformLinkMetadata,
): string | null {
  const pruned = prune(metadata);
  const meaningful = Object.keys(pruned).filter((k) => k !== "v");
  if (meaningful.length === 0) return null;
  return JSON.stringify({
    ...pruned,
    v: typeof pruned.v === "number" ? pruned.v : PLATFORM_LINK_METADATA_VERSION,
  });
}

/**
 * 通知チャンネル ID を取り出す。未設定・不正値はどちらも `null`。
 *
 * 保存時に検証しているので不正値は本来入らないが、手で D1 を触られた場合にも
 * 「読み出しは必ず snowflake か null」を保証しておく方が呼び出し側が楽。
 */
export function getNotifyChannelId(
  raw: string | null | undefined,
): string | null {
  const channelId = parsePlatformLinkMetadata(raw).notify?.channelId;
  return isSnowflake(channelId) ? channelId : null;
}

/**
 * 通知チャンネルの設定/解除パッチ。`null` を渡すと `notify.channelId` を消す。
 * {@link mergePlatformLinkMetadata} に渡して使う。
 */
export function buildNotifyChannelPatch(
  channelId: string | null,
): PlatformLinkMetadata {
  return {
    v: PLATFORM_LINK_METADATA_VERSION,
    notify: { channelId: channelId ?? undefined },
  };
}
