import {
  type IdentityDb,
  getPlatformLink,
  upsertPlatformLink,
} from "../queries.js";
import type { NewPlatformLink, PlatformLink } from "../schema.js";

export type PlatformLinkHandlerDeps = {
  db: IdentityDb;
  now?: () => number;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function serialize(row: PlatformLink): {
  provider: string;
  platformId: string;
  treeId: string;
  installedBy: string;
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
  };
  return metadata === undefined ? base : { ...base, metadata };
}

/**
 * GET  /api/platform-link?provider=&platform_id=  -> { ... } | 404
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
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return json(400, {
        error: "invalid_body",
        details: "Request body is not valid JSON",
      });
    }
    if (typeof raw !== "object" || raw === null) {
      return json(400, { error: "invalid_body" });
    }
    const r = raw as Record<string, unknown>;
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
    const metadataStr =
      r.metadata === undefined || r.metadata === null
        ? null
        : typeof r.metadata === "string"
          ? r.metadata
          : JSON.stringify(r.metadata);
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
