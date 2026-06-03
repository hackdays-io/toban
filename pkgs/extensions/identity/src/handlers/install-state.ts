import { type IdentityDb, claimInstallStateJti } from "../queries.js";

export type InstallStateHandlerDeps = {
  db: IdentityDb;
  /**
   * Shared secret required in the `x-toban-platform-link-secret` header
   * (we reuse the platform-link secret because both endpoints serve the
   * same trust boundary: the discord-bot Worker). Absent → 401.
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

/**
 * POST /api/install-state/claim-jti  { jti: string } → { ok: true } | 409
 *
 * Single-use claim for an OAuth-install state-JWT `jti`. The first call
 * for a given `jti` returns 200; any subsequent call returns 409 so the
 * caller can reject the install attempt. Use this *before* exchanging
 * the OAuth `code` so a replayed state never produces a side effect.
 */
export async function handleInstallStateClaim(
  request: Request,
  deps: InstallStateHandlerDeps,
): Promise<Response> {
  if (request.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }
  if (!deps.writeSecret) {
    return json(401, {
      error: "unauthorized",
      details: "install-state write secret is not configured",
    });
  }
  const supplied = request.headers.get("x-toban-platform-link-secret");
  if (supplied !== deps.writeSecret) {
    return json(401, { error: "unauthorized" });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { error: "invalid_body" });
  }
  if (typeof raw !== "object" || raw === null) {
    return json(400, { error: "invalid_body" });
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.jti !== "string" || r.jti.length === 0) {
    return json(400, {
      error: "invalid_body",
      details: "jti is required",
    });
  }

  const now = (deps.now ?? (() => Math.floor(Date.now() / 1000)))();
  try {
    await claimInstallStateJti(deps.db, r.jti, now);
  } catch {
    // PK conflict ⇒ already claimed. We deliberately don't try to
    // distinguish transient D1 errors here; either way the safe
    // behaviour is to refuse the install attempt. The caller surfaces
    // a generic "already used / try again" error to the admin.
    return json(409, { error: "jti_already_used" });
  }
  return json(200, { ok: true });
}
