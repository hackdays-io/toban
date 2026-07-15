/**
 * verifier_token issuer.
 *
 * Issued from `/toban-setup` and consumed by the identity worker's
 * `providers/discord.ts` to confirm that the bot really observed
 * `accountId` (a Discord snowflake) via an authenticated interaction.
 *
 * Shape (intentionally minimal):
 *   {
 *     iss: "toban-discord-bot",
 *     provider: "discord",
 *     accountId: "<snowflake>",
 *     exp: <unix-seconds, 15 minutes>
 *   }
 *
 * Algorithm is ES256 (P-256 ECDSA). The matching public key is published
 * to the identity worker as `DISCORD_BOT_VERIFIER_PUBLIC_KEY`.
 */
import { SignJWT, importPKCS8 } from "jose";

const ISSUER = "toban-discord-bot";
const ALG = "ES256";
/** Token lifetime in seconds. 15 minutes is enough for the OAuth-style
 *  hand-off (Discord DM -> click link -> wallet sign) but bounds the
 *  blast radius of a leaked token. */
export const VERIFIER_TOKEN_TTL_SECONDS = 15 * 60;

export interface VerifierTokenClaims {
  iss: string;
  provider: "discord";
  accountId: string;
  exp: number;
}

/**
 * Issue a verifier_token. `nowSeconds` is injectable for tests.
 */
export async function issueVerifierToken(
  privateKeyPem: string,
  accountId: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  if (!accountId) throw new Error("accountId required");
  const key = await importPKCS8(privateKeyPem, ALG);
  return await new SignJWT({ provider: "discord", accountId })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setExpirationTime(nowSeconds + VERIFIER_TOKEN_TTL_SECONDS)
    .setIssuedAt(nowSeconds)
    .sign(key);
}

export const VERIFIER_ISSUER = ISSUER;
export const VERIFIER_ALG = ALG;
