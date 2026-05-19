import { discordProvider } from "./discord.js";
import type { ProviderDefinition } from "./types.js";

/**
 * Provider registry — the single dispatch table used by `handlers/connect.ts`.
 *
 * MVP only ships `discord` (issue #507). Future providers (`slack`, `github`)
 * register here as separate PRs without touching the handler.
 */
export const providers: Record<string, ProviderDefinition> = {
  [discordProvider.name]: discordProvider,
};

export type {
  ProviderDefinition,
  IdentityEnv,
  VerifiedAccount,
} from "./types.js";
export {
  discordProvider,
  DISCORD_PROVIDER_NAME,
  DISCORD_VERIFIER_ISSUER,
  DiscordProviderError,
} from "./discord.js";
