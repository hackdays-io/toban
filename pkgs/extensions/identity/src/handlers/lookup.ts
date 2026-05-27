import { providers } from "../providers/index.js";
import type { IdentityEnv, ProviderDefinition } from "../providers/types.js";
import { type IdentityDb, getIdentity } from "../queries.js";

export type LookupHandlerDeps = {
  db: IdentityDb;
  env: IdentityEnv;
  /** Provider registry override (tests pass a minimal map). */
  registry?: Record<string, ProviderDefinition>;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * GET /api/lookup?provider=discord&account_id=<snowflake>
 *
 * Returns `{ wallet, metadata? }` on hit, `{ error: "not_found" }` 404
 * otherwise. `metadata` is parsed from its JSON string representation
 * if present so that callers don't need to know it was stored as TEXT.
 *
 * Two-mode auth (per #9 review finding — the original
 * fully-unauthenticated endpoint enabled trivial enumeration of all
 * snowflake → wallet bindings via the public workers.dev URL):
 *
 *   1. Server-to-server: caller presents the shared lookup secret in
 *      `x-toban-lookup-secret`. Used by the discord-bot Worker.
 *   2. Browser-side connect flow: caller presents the verifier_token
 *      JWT as `authorization: Bearer <jwt>`. The handler verifies the
 *      JWT against the provider's registered public key and confirms
 *      the JWT's `accountId` matches the requested `account_id`. This
 *      caps the lookup to "the holder of a `/toban-setup`-issued JWT
 *      for this exact snowflake" — i.e. the user themselves, with no
 *      enumeration possible.
 */
export async function handleLookup(
  request: Request,
  deps: LookupHandlerDeps,
): Promise<Response> {
  if (request.method !== "GET") {
    return json(405, { error: "method_not_allowed" });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  // Accept either snake_case (canonical, per #507 wire spec) or
  // camelCase to match the bot's TS-style HttpIdentityClient.
  const accountId =
    url.searchParams.get("account_id") ?? url.searchParams.get("accountId");
  if (!provider || !accountId) {
    return json(400, {
      error: "invalid_query",
      details: "provider and account_id are required",
    });
  }

  // --- Auth ---------------------------------------------------------
  const sharedSecret = deps.env.LOOKUP_READ_SECRET;
  const suppliedSecret = request.headers.get("x-toban-lookup-secret");
  let authorized = false;
  if (sharedSecret && suppliedSecret === sharedSecret) {
    authorized = true;
  } else {
    const authz = request.headers.get("authorization");
    const bearer = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
    if (bearer) {
      const registry = deps.registry ?? providers;
      const providerDef = registry[provider];
      if (providerDef) {
        try {
          const verified = await providerDef.verifyVerifierToken(
            bearer,
            deps.env,
          );
          if (verified.accountId === accountId) {
            authorized = true;
          }
        } catch {
          // Fall through to 401 below.
        }
      }
    }
  }
  if (!authorized) {
    return json(401, { error: "unauthorized" });
  }

  const row = await getIdentity(deps.db, provider, accountId);
  if (row === null) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }

  let metadata: unknown;
  if (row.metadata !== null && row.metadata !== undefined) {
    try {
      metadata = JSON.parse(row.metadata);
    } catch {
      metadata = row.metadata;
    }
  }

  const body =
    metadata === undefined
      ? { wallet: row.wallet }
      : { wallet: row.wallet, metadata };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
