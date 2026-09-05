/**
 * Guild-scoped bearer tokens for the MCP endpoint.
 *
 * A token says exactly one thing: "the bearer may act for guild G". It is an
 * HMAC over the guild id, so verification is stateless — no table, no lookup,
 * no write path into the shared D1 (this Worker never writes identity tables;
 * see CLAUDE.md).
 *
 * **The guild is pinned in the credential, not in the request body.** That is
 * the whole point: a third-party agent holding a token for guild A cannot read
 * or propose anything for guild B, whatever its model decides to send. It also
 * means a token is safe to hand to a community that runs its own OpenClaw.
 *
 * Known limitation: revocation is all-or-nothing (rotate `MCP_TOKEN_SECRET`,
 * which invalidates every guild's token at once). Per-guild revocation needs a
 * version counter alongside the platform link — worth doing once
 * `platform_links` grows the `metadata` usage, not before.
 */

const TOKEN_PREFIX = "tbn1";
/**
 * Separator. Must be outside the base64url alphabet (`A-Za-z0-9-_`) — an
 * underscore here would split the MAC itself, which is exactly the bug the
 * round-trip test caught.
 */
const SEP = ".";
/** Truncated MAC length in base64url chars (~132 bits — plenty for a bearer). */
const MAC_CHARS = 22;

function base64url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function mac(secret: string, guildId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`mcp:v1:${guildId}`),
  );
  return base64url(sig).slice(0, MAC_CHARS);
}

/** Mint the token for one guild. Used by `scripts/mint-mcp-token.ts`. */
export async function issueGuildToken(
  secret: string,
  guildId: string,
): Promise<string> {
  if (!/^\d+$/.test(guildId)) {
    throw new Error(`guildId must be a snowflake: ${guildId}`);
  }
  return [TOKEN_PREFIX, guildId, await mac(secret, guildId)].join(SEP);
}

/** Length-independent comparison so a mismatch leaks no position. */
function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export type AuthResult =
  | { ok: true; guildId: string }
  | { ok: false; status: 401 | 500; message: string };

/**
 * Verify an `Authorization: Bearer <token>` header.
 *
 * Returns the guild the caller is allowed to act for. Callers must use this
 * guild id and ignore any guild id in the request body.
 */
export async function authenticate(
  secret: string | undefined,
  header: string | null,
): Promise<AuthResult> {
  if (!secret) {
    // Fail closed: without the secret every token would verify against "".
    return {
      ok: false,
      status: 500,
      message: "MCP_TOKEN_SECRET is not configured",
    };
  }
  const raw = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!raw) {
    return { ok: false, status: 401, message: "missing bearer token" };
  }
  const parts = raw.split(SEP);
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) {
    return { ok: false, status: 401, message: "malformed token" };
  }
  const [, guildId, presented] = parts;
  if (!/^\d+$/.test(guildId)) {
    return { ok: false, status: 401, message: "malformed token" };
  }
  const expected = await mac(secret, guildId);
  if (!timingSafeEqual(expected, presented)) {
    return { ok: false, status: 401, message: "invalid token" };
  }
  return { ok: true, guildId };
}
