// Public surface of `@toban/identity`. Consumers should import from the package
// root rather than reaching into `./src/...` subpaths so we can refactor the
// internals freely.

export {
  buildIdentityBindingDomain,
  hashVerifierToken,
  IDENTITY_BINDING_DOMAIN_NAME,
  IDENTITY_BINDING_DOMAIN_VERSION,
  IDENTITY_BINDING_PRIMARY_TYPE,
  IDENTITY_BINDING_TYPES,
} from "./eip712/identity-binding.js";
export type {
  IdentityBindingDomain,
  IdentityBindingMessage,
  IdentityBindingTypedData,
} from "./eip712/identity-binding.js";

export {
  JwtVerificationError,
  recoverIdentityBindingSigner,
  verifyJwtES256,
} from "./verify.js";
export type { IdentityJwtClaims, JwtErrorCode } from "./verify.js";

export {
  DISCORD_PROVIDER_NAME,
  DISCORD_VERIFIER_ISSUER,
  DiscordProviderError,
  discordProvider,
  providers,
} from "./providers/index.js";
export type {
  IdentityEnv,
  ProviderDefinition,
  VerifiedAccount,
} from "./providers/types.js";

export {
  identities,
  platformLinks,
  usedBindingNonces,
} from "./schema.js";
export type {
  Identity,
  NewIdentity,
  NewPlatformLink,
  PlatformLink,
  UsedBindingNonce,
} from "./schema.js";

export {
  getIdentity,
  getPlatformLink,
  isNonceUsed,
  markNonceUsed,
  upsertIdentity,
  upsertPlatformLink,
} from "./queries.js";
export type { IdentityDb } from "./queries.js";

export { handleConnect } from "./handlers/connect.js";
export type {
  ConnectErrorCode,
  ConnectHandlerDeps,
  ConnectRequest,
} from "./handlers/connect.js";

export { handleLookup } from "./handlers/lookup.js";
export type { LookupHandlerDeps } from "./handlers/lookup.js";
