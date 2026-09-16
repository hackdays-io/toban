/**
 * `tbn2` bearer tokens for the MCP endpoint.
 *
 * A token says two things: "the bearer's home workspace is `treeId`" and
 * "look up `tokenId` to see whether that's still true". Verification is
 * two stages on purpose (see `docs/mcp-extraction.md` §4):
 *
 *  1. **Stateless MAC check.** `HMAC(secret, "mcp:v2:" + treeId + ":" +
 *     tokenId)` — no D1 read. This filters out garbage tokens before they
 *     can cost a database round-trip, so an attacker spraying random
 *     strings cannot turn this endpoint into a D1-read amplifier.
 *  2. **Registry lookup.** Only once the MAC passes do we look `tokenId` up
 *     in `mcp_tokens` to confirm it exists for this `treeId` and has not
 *     been revoked. This is what makes per-token revocation possible — the
 *     predecessor (`tbn1`, guild-scoped) could only be revoked all-or-nothing
 *     by rotating the shared secret.
 *
 * ## Why the prefix AND the MAC message both changed from `tbn1`
 *
 * `tbn1` was `HMAC(secret, "mcp:v1:" + guildId)`. Both `guildId` (Discord
 * snowflake) and `treeId` (decimal Hats tree id) match `^\d+$`, so if the MAC
 * message prefix had stayed `"mcp:v1:"`, `HMAC(secret, "mcp:v1:42")` would
 * verify identically whether "42" means "guild 42" or "tree 42" — a stale
 * `tbn1` token could be silently reinterpreted as a `tbn2` token for the
 * wrong kind of "42", or worse, minted for a value from the wrong id space.
 * Changing the human-readable prefix (`tbn2`) rejects an old token as
 * malformed at the earliest possible check; changing the MAC message prefix
 * (`mcp:v2:`) makes sure the two token generations can never validate
 * against each other's ids even if the human-readable prefix were ignored.
 */

const TOKEN_PREFIX = "tbn2";
/** Same reasoning as `tbn1`: outside the base64url alphabet so it can't
 *  collide with a MAC segment. */
const SEP = ".";
/** Truncated MAC length in base64url chars (~132 bits — plenty for a bearer). */
const MAC_CHARS = 22;

function base64url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Random, URL-safe token id — the primary key of `mcp_tokens`. */
export function generateTokenId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return base64url(bytes.buffer);
}

async function mac(
  secret: string,
  treeId: string,
  tokenId: string,
): Promise<string> {
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
    new TextEncoder().encode(`mcp:v2:${treeId}:${tokenId}`),
  );
  return base64url(sig).slice(0, MAC_CHARS);
}

/** Assemble the bearer token string for one registry row. */
export async function issueToken(
  secret: string,
  treeId: string,
  tokenId: string,
): Promise<string> {
  if (!/^\d+$/.test(treeId)) {
    throw new Error(`treeId must be numeric: ${treeId}`);
  }
  return [
    TOKEN_PREFIX,
    treeId,
    tokenId,
    await mac(secret, treeId, tokenId),
  ].join(SEP);
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
  | { ok: true; treeId: string; tokenId: string }
  | { ok: false; status: 401 | 500; message: string };

/**
 * Look up whether a `tokenId` (that has already passed the MAC check) is
 * still valid for `treeId`. Injected so the Worker entry point can back it
 * with real D1 (`registry.ts`) while tests stub it directly — same
 * convention as `IdentityClient` stubbing elsewhere in this repo.
 */
export type TokenLookup = (
  tokenId: string,
) => Promise<{ treeId: string; revoked: boolean } | null>;

/**
 * Verify an `Authorization: Bearer <token>` header.
 *
 * Returns the caller's home `treeId` and `tokenId`. Read tools may accept a
 * `treeId` argument that overrides this default (see `tools.ts`), but
 * identity resolution and every propose tool must use this value only.
 */
export async function authenticate(
  secret: string | undefined,
  header: string | null,
  lookup: TokenLookup,
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
  if (parts.length !== 4 || parts[0] !== TOKEN_PREFIX) {
    return { ok: false, status: 401, message: "malformed token" };
  }
  const [, treeId, tokenId, presented] = parts;
  if (!/^\d+$/.test(treeId) || tokenId.length === 0) {
    return { ok: false, status: 401, message: "malformed token" };
  }
  const expected = await mac(secret, treeId, tokenId);
  if (!timingSafeEqual(expected, presented)) {
    return { ok: false, status: 401, message: "invalid token" };
  }
  // Stage 2 only runs once stage 1 has already filtered out noise.
  const row = await lookup(tokenId);
  if (!row || row.treeId !== treeId) {
    return { ok: false, status: 401, message: "unknown token" };
  }
  if (row.revoked) {
    return { ok: false, status: 401, message: "revoked token" };
  }
  return { ok: true, treeId, tokenId };
}
