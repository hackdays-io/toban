/**
 * Cloudflare Workers entry for `@toban/mcp`.
 *
 * Routes:
 *   POST /mcp                    — the MCP endpoint (bearer `tbn2` token)
 *   POST /api/mcp-tokens         — issue a new token (EIP-712 wallet auth)
 *   POST /api/mcp-tokens/list    — list a workspace's tokens
 *   POST /api/mcp-tokens/revoke  — revoke one token
 *   GET  /health
 *
 * `DB` is this Worker's own D1 binding — it owns exactly one table's worth
 * of data, the `tbn2` registry (`schema.ts`). It never writes to
 * `@toban/identity`'s tables directly; identity reads go through the
 * `IDENTITY` service binding (`identity.ts`).
 */
import { drizzle } from "drizzle-orm/d1";
import type { Env } from "./env.js";
import { handleIssueToken } from "./handlers/issue.js";
import { handleListTokens } from "./handlers/list.js";
import { handleRevokeToken } from "./handlers/revoke.js";
import { json } from "./http.js";
import { handleMcpRequest } from "./index.js";

function corsHeaders(origin: string | null): HeadersInit {
  // `/api/mcp-tokens*` is called from the browser (the settings page); `/mcp`
  // is server-to-server and does not need CORS, but allowing it uniformly is
  // harmless — authentication is a bearer token / EIP-712 signature, not the
  // same-origin policy, on every route here. Mirrors @toban/identity/worker.ts.
  return {
    "access-control-allow-origin": origin ?? "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("origin");
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const url = new URL(request.url);

    // Built inline, per route, rather than once up front: `/mcp` builds its
    // own instance inside `index.ts`, and `/health` / the 404 branch never
    // touch D1 at all — a single shared instance built unconditionally here
    // would be wasted work on every one of those requests.
    try {
      let response: Response;
      switch (url.pathname) {
        case "/mcp":
          response = await handleMcpRequest(env, request);
          break;
        case "/api/mcp-tokens":
          response = await handleIssueToken(request, {
            db: drizzle(env.DB),
            env,
          });
          break;
        case "/api/mcp-tokens/list":
          response = await handleListTokens(request, {
            db: drizzle(env.DB),
            env,
          });
          break;
        case "/api/mcp-tokens/revoke":
          response = await handleRevokeToken(request, {
            db: drizzle(env.DB),
            env,
          });
          break;
        case "/health":
          response = json(200, { ok: true });
          break;
        default:
          response = json(404, { error: "not_found", details: url.pathname });
      }
      return withCors(response, origin);
    } catch (err) {
      console.error("mcp worker error:", err);
      return withCors(
        json(500, {
          error: "internal_error",
          details: err instanceof Error ? err.message : String(err),
        }),
        origin,
      );
    }
  },
} satisfies ExportedHandler<Env>;
