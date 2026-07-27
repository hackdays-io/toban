/**
 * GET /api/install/start?treeId=<decimal>
 *
 * Entry point for the frontend-initiated Discord install. The frontend
 * ("サーバーに追加" button on `/<treeId>/discord-bot`) links here rather than
 * to Discord directly, because the OAuth `state` must be signed with
 * `INSTALL_STATE_SECRET` — a Worker secret the browser must never see.
 *
 * Steps:
 *   1. Validate `treeId` (decimal tree id).
 *   2. Mint a single-use `jti` and sign a short-lived install-state JWT
 *      binding `{ treeId, jti }`. The guild is deliberately NOT committed
 *      here: the admin chooses the target server on Discord's consent
 *      screen, so we can't know it yet. `/api/install/callback` binds to
 *      whichever guild Discord actually grants (confirmed via the OAuth
 *      token exchange).
 *   3. 302-redirect the browser to Discord's OAuth authorize URL with the
 *      `bot` + `applications.commands` scopes so the callback can register
 *      slash commands on the new guild.
 *
 * Pairs with `callback.ts` (which consumes the `state` and jti).
 */
import { SignJWT, importPKCS8 } from "jose";
import type { Env } from "../../env";

const ISSUER = "toban-discord-bot";
/** Enough for the Discord consent hand-off; bounds a leaked state's life. */
const STATE_TTL_SECONDS = 10 * 60;
/** 2048 = Send Messages — the minimum the bot needs (DMs the setup link). */
const BOT_PERMISSIONS = "2048";
const VALID_TREE_ID = /^[0-9]+$/;

/**
 * Sign the install-state JWT. Mirrors `verifyInstallState`'s dual-format
 * handling in `callback.ts`: a PEM PKCS8 key signs ES256 (asymmetric,
 * preferred for prod), any other string is an HMAC secret signing HS256
 * (convenient when the same Worker both signs and verifies).
 */
async function signInstallState(
  env: Env,
  claims: { treeId: string; jti: string },
  nowSeconds: number,
): Promise<string> {
  const isPem = env.INSTALL_STATE_SECRET.includes("BEGIN");
  const jwt = new SignJWT({ treeId: claims.treeId })
    .setProtectedHeader({ alg: isPem ? "ES256" : "HS256" })
    .setIssuer(ISSUER)
    .setJti(claims.jti)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + STATE_TTL_SECONDS);
  const key = isPem
    ? await importPKCS8(env.INSTALL_STATE_SECRET, "ES256")
    : new TextEncoder().encode(env.INSTALL_STATE_SECRET);
  return jwt.sign(key);
}

export async function handleInstallStart(
  env: Env,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const treeId = url.searchParams.get("treeId");
  if (!treeId || !VALID_TREE_ID.test(treeId)) {
    return new Response("treeId が指定されていないか、形式が正しくありません", {
      status: 400,
    });
  }

  const jti = crypto.randomUUID();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const state = await signInstallState(env, { treeId, jti }, nowSeconds);

  const redirectUri = `${env.BOT_WORKER_URL.replace(/\/$/, "")}/api/install/callback`;
  const authorize = new URL("https://discord.com/api/oauth2/authorize");
  authorize.searchParams.set("client_id", env.DISCORD_APP_ID);
  authorize.searchParams.set("scope", "bot applications.commands");
  authorize.searchParams.set("permissions", BOT_PERMISSIONS);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("state", state);

  return new Response(null, {
    status: 302,
    headers: {
      location: authorize.toString(),
      // The state rides in the query of the outbound redirect; keep it out
      // of any downstream Referer.
      "referrer-policy": "no-referrer",
    },
  });
}
