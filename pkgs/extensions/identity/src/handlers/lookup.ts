import { type IdentityDb, getIdentity } from "../queries.js";

export type LookupHandlerDeps = {
  db: IdentityDb;
};

/**
 * GET /api/lookup?provider=discord&account_id=<snowflake>
 *
 * Returns `{ wallet, metadata? }` on hit, `{ error: "not_found" }` 404 otherwise.
 * `metadata` is parsed from its JSON string representation if present so that
 * callers don't need to know it was stored as TEXT.
 */
export async function handleLookup(
  request: Request,
  deps: LookupHandlerDeps,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  const accountId = url.searchParams.get("account_id");
  if (!provider || !accountId) {
    return new Response(
      JSON.stringify({
        error: "invalid_query",
        details: "provider and account_id are required",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
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
