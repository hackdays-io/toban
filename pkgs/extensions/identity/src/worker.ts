/**
 * Cloudflare Worker entry for @toban/identity.
 *
 * Routes:
 *   POST /api/connect         — IdentityBinding verification + upsert
 *   GET  /api/lookup          — (provider, account_id) -> wallet
 *   GET  /api/platform-link   — (provider, platform_id) -> tree_id binding
 *   POST /api/platform-link   — upsert a workspace ↔ platform binding
 *
 * D1 is bound as `DB`. Verifier JWT public keys are read from `env` per
 * provider (see `providers/`); for Discord the env var is
 * `DISCORD_BOT_VERIFIER_PUBLIC_KEY` (PEM SPKI).
 */
import { drizzle } from "drizzle-orm/d1";
import { handleConnect } from "./handlers/connect.js";
import { handleLookup } from "./handlers/lookup.js";
import { handlePlatformLink } from "./handlers/platform-link.js";
import type { IdentityEnv } from "./providers/types.js";

export interface WorkerEnv extends IdentityEnv {
  DB: D1Database;
}

function corsHeaders(origin: string | null): HeadersInit {
  // The frontend dev server and prod toban.xyz both POST /api/connect from
  // the browser. Until we know the production frontend origin set, allow any
  // origin for the read-only/write paths under /api — these have no cookies
  // and rely on cryptographic proofs (JWT + EIP-712), not the same-origin
  // policy, for authentication.
  return {
    "access-control-allow-origin": origin ?? "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  };
}

function withCors(res: Response, origin: string | null): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(origin))) {
    headers.set(k, v as string);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);
    const db = drizzle(env.DB);

    try {
      let response: Response;
      switch (url.pathname) {
        case "/api/connect":
          response = await handleConnect(request, { db, env });
          break;
        case "/api/lookup":
          response = await handleLookup(request, { db });
          break;
        case "/api/platform-link":
          response = await handlePlatformLink(request, { db });
          break;
        case "/health":
          response = new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
          break;
        default:
          response = new Response(
            JSON.stringify({ error: "not_found", details: url.pathname }),
            {
              status: 404,
              headers: { "content-type": "application/json" },
            },
          );
      }
      return withCors(response, origin);
    } catch (err) {
      console.error("identity worker error:", err);
      return withCors(
        new Response(
          JSON.stringify({
            error: "internal_error",
            details: err instanceof Error ? err.message : String(err),
          }),
          { status: 500, headers: { "content-type": "application/json" } },
        ),
        origin,
      );
    }
  },
} satisfies ExportedHandler<WorkerEnv>;
