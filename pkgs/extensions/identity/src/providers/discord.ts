import { JwtVerificationError, verifyJwtES256 } from "../verify.js";
import type {
  IdentityEnv,
  ProviderDefinition,
  VerifiedAccount,
} from "./types.js";

/**
 * Issuer string the Discord bot worker (`extensions/discord-bot`, issue #508)
 * sets in its JWT `iss` claim. Pinning it here means a leaked key for a
 * different Toban service can't masquerade as the Discord bot.
 */
export const DISCORD_VERIFIER_ISSUER = "toban-discord-bot" as const;

export const DISCORD_PROVIDER_NAME = "discord" as const;

export class DiscordProviderError extends Error {
  readonly code: "missing_public_key" | "wrong_provider_claim";
  constructor(
    code: "missing_public_key" | "wrong_provider_claim",
    message: string,
  ) {
    super(message);
    this.name = "DiscordProviderError";
    this.code = code;
  }
}

/**
 * Verify a `verifier_token` issued by the Discord bot.
 *
 * The JWT must:
 *  - be signed ES256 (P-256) with the bot's private key,
 *  - have `iss === "toban-discord-bot"`,
 *  - have `provider === "discord"`,
 *  - have a string `accountId` (Discord snowflake),
 *  - be unexpired.
 *
 * The public key is read from `env.DISCORD_BOT_VERIFIER_PUBLIC_KEY`
 * (PEM-encoded SPKI). It is never hardcoded — rotating keys is then
 * a config change rather than a code change.
 */
export async function verifyDiscordVerifierToken(
  token: string,
  env: IdentityEnv,
): Promise<VerifiedAccount> {
  const pem = env.DISCORD_BOT_VERIFIER_PUBLIC_KEY;
  if (!pem) {
    throw new DiscordProviderError(
      "missing_public_key",
      "DISCORD_BOT_VERIFIER_PUBLIC_KEY env binding is required to verify Discord tokens",
    );
  }

  const claims = await verifyJwtES256(token, pem, DISCORD_VERIFIER_ISSUER);

  if (claims.provider !== DISCORD_PROVIDER_NAME) {
    throw new DiscordProviderError(
      "wrong_provider_claim",
      `Expected provider claim 'discord', got '${claims.provider}'`,
    );
  }

  return {
    accountId: claims.accountId,
    expiresAt: claims.exp,
  };
}

export const discordProvider: ProviderDefinition = {
  name: DISCORD_PROVIDER_NAME,
  verifyVerifierToken: verifyDiscordVerifierToken,
};

export { JwtVerificationError };
