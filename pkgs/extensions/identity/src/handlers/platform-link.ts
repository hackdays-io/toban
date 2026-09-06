import {
  buildNotifyChannelPatch,
  getNotifyChannelId,
  isSnowflake,
  mergePlatformLinkMetadata,
  parsePlatformLinkMetadata,
  serializePlatformLinkMetadata,
} from "../platform-link-metadata.js";
import {
  type IdentityDb,
  getPlatformLink,
  updatePlatformLinkMetadata,
  upsertPlatformLink,
} from "../queries.js";
import type { NewPlatformLink, PlatformLink } from "../schema.js";

export type PlatformLinkHandlerDeps = {
  db: IdentityDb;
  /**
   * Shared secret that `POST /api/platform-link` callers must echo in
   * the `x-toban-platform-link-secret` header. Must come from the
   * consumer Worker's env. Absent secret → POST is closed (401) — we
   * never serve an unauthenticated write path because the route is
   * exposed via the same workers.dev URL the frontend hits.
   */
  writeSecret?: string;
  now?: () => number;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** `x-toban-platform-link-secret` を検証する。OK なら `null` を返す。 */
function checkWriteSecret(
  request: Request,
  deps: PlatformLinkHandlerDeps,
): Response | null {
  if (!deps.writeSecret) {
    return json(401, {
      error: "unauthorized",
      details: "platform-link write secret is not configured",
    });
  }
  if (
    request.headers.get("x-toban-platform-link-secret") !== deps.writeSecret
  ) {
    return json(401, { error: "unauthorized" });
  }
  return null;
}

async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, {
      error: "invalid_body",
      details: "Request body is not valid JSON",
    });
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return json(400, { error: "invalid_body" });
  }
  return raw as Record<string, unknown>;
}

function serialize(row: PlatformLink): {
  provider: string;
  platformId: string;
  treeId: string;
  installedBy: string;
  notifyChannelId: string | null;
  metadata?: unknown;
} {
  let metadata: unknown;
  if (row.metadata !== null && row.metadata !== undefined) {
    try {
      metadata = JSON.parse(row.metadata);
    } catch {
      metadata = row.metadata;
    }
  }
  const base = {
    provider: row.provider,
    platformId: row.platformId,
    treeId: row.treeId,
    installedBy: row.installedBy,
    // metadata 由来の派生フィールド。読み手に JSON の内部構造を知らせずに
    // 済ませるため、生の metadata と両方返す。
    notifyChannelId: getNotifyChannelId(row.metadata),
  };
  return metadata === undefined ? base : { ...base, metadata };
}

/**
 * GET  /api/platform-link?provider=&platform_id=  -> { ..., notifyChannelId } | 404
 * POST /api/platform-link   { provider, platformId, treeId, installedBy, metadata? } -> { ok: true }
 *
 * Mounted by the consumer Worker. The route table lives in `worker.ts`; this
 * function is pure `Request -> Response` so it can be wrapped or tested in
 * isolation.
 */
export async function handlePlatformLink(
  request: Request,
  deps: PlatformLinkHandlerDeps,
): Promise<Response> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider");
    const platformId =
      url.searchParams.get("platform_id") ?? url.searchParams.get("platformId");
    if (!provider || !platformId) {
      return json(400, {
        error: "invalid_query",
        details: "provider and platform_id are required",
      });
    }
    const row = await getPlatformLink(deps.db, provider, platformId);
    if (row === null) return json(404, { error: "not_found" });
    return json(200, serialize(row));
  }

  if (request.method === "POST") {
    const unauthorized = checkWriteSecret(request, deps);
    if (unauthorized) return unauthorized;

    const parsed = await readJsonObject(request);
    if (parsed instanceof Response) return parsed;
    const r = parsed;
    const platformId =
      typeof r.platformId === "string" ? r.platformId : r.platform_id;
    const installedBy =
      typeof r.installedBy === "string" ? r.installedBy : r.installed_by;
    const treeId = typeof r.treeId === "string" ? r.treeId : r.tree_id;
    if (
      typeof r.provider !== "string" ||
      typeof platformId !== "string" ||
      typeof treeId !== "string" ||
      typeof installedBy !== "string"
    ) {
      return json(400, {
        error: "invalid_body",
        details:
          "provider, platformId, treeId, installedBy are required strings",
      });
    }
    const now = (deps.now ?? (() => Math.floor(Date.now() / 1000)))();

    // metadata の扱い:
    //   キー無し → 既存の metadata を保持（再インストールで通知設定などを
    //              消さないため。install 経路は metadata を送ってこない）
    //   null     → 明示的な全消去
    //   その他   → 丸ごと置き換え（呼び出し側が全体を持っている場合）
    let metadataStr: string | null;
    if (!("metadata" in r)) {
      const existing = await getPlatformLink(deps.db, r.provider, platformId);
      metadataStr = existing?.metadata ?? null;
    } else if (r.metadata === null) {
      metadataStr = null;
    } else {
      metadataStr =
        typeof r.metadata === "string"
          ? r.metadata
          : JSON.stringify(r.metadata);
    }

    const newRow: NewPlatformLink = {
      provider: r.provider,
      platformId,
      treeId,
      installedBy,
      metadata: metadataStr,
      createdAt: now,
    };
    await upsertPlatformLink(deps.db, newRow);
    return json(200, { ok: true });
  }

  return json(405, { error: "method_not_allowed" });
}

/**
 * POST /api/platform-link/notify-channel
 *   { provider, platformId, channelId: string | null }
 *   -> 200 { ok: true, notifyChannelId }
 *
 * 通知の投稿先チャンネルを設定/解除する。認証は `POST /api/platform-link` と
 * 同じ `x-toban-platform-link-secret`。
 *
 * ここが `metadata` 全体を受け取る汎用 PATCH ではないのは意図的で、
 * `notify` 名前空間の値の妥当性（snowflake であること）に責任を持つ場所を
 * 1 か所に固定するため。他の名前空間はそれぞれ自分のルートを足す
 * （`platform-link-metadata.ts` の「新しい名前空間を足すときの作法」を参照）。
 *
 * 書き込みは必ず read-modify-write。既存の metadata を読んでマージするので、
 * `mcp` など他のキーは消えない。
 */
export async function handlePlatformLinkNotifyChannel(
  request: Request,
  deps: PlatformLinkHandlerDeps,
): Promise<Response> {
  if (request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const unauthorized = checkWriteSecret(request, deps);
  if (unauthorized) return unauthorized;

  const parsed = await readJsonObject(request);
  if (parsed instanceof Response) return parsed;
  const r = parsed;

  const platformId =
    typeof r.platformId === "string" ? r.platformId : r.platform_id;
  if (typeof r.provider !== "string" || typeof platformId !== "string") {
    return json(400, {
      error: "invalid_body",
      details: "provider and platformId are required strings",
    });
  }

  const rawChannelId =
    "channelId" in r
      ? r.channelId
      : "channel_id" in r
        ? r.channel_id
        : undefined;
  if (rawChannelId === undefined) {
    return json(400, {
      error: "invalid_body",
      details: "channelId is required (use null to clear)",
    });
  }
  let channelId: string | null;
  if (rawChannelId === null) {
    channelId = null;
  } else if (isSnowflake(rawChannelId)) {
    channelId = rawChannelId;
  } else {
    return json(400, {
      error: "invalid_channel_id",
      details: "channelId must be a Discord snowflake (17-20 digits) or null",
    });
  }

  const row = await getPlatformLink(deps.db, r.provider, platformId);
  if (row === null) return json(404, { error: "not_found" });

  const next = mergePlatformLinkMetadata(
    parsePlatformLinkMetadata(row.metadata),
    buildNotifyChannelPatch(channelId),
  );
  await updatePlatformLinkMetadata(
    deps.db,
    r.provider,
    platformId,
    serializePlatformLinkMetadata(next),
  );

  return json(200, { ok: true, notifyChannelId: channelId });
}
