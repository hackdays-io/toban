/**
 * Per-extension env. Each consumer Worker injects the secrets/key bindings
 * relevant to the providers it actually mounts. Identity itself never
 * reads `process.env` — it is Worker-friendly and explicit.
 */
export type IdentityEnv = {
  /**
   * PEM SPKI ES256 public key of the Discord bot worker (`extensions/discord-bot`).
   * Required if the `discord` provider is enabled.
   */
  DISCORD_BOT_VERIFIER_PUBLIC_KEY?: string;
};

export type VerifiedAccount = {
  /** Stable, provider-scoped account id (Discord snowflake, etc.). */
  accountId: string;
  /** Unix seconds at which the verifier_token expires (== JWT `exp`). */
  expiresAt: number;
};

/**
 * Provider verification adapter. One per Web2 source (discord, slack, github, ...).
 *
 * - `name` MUST match the `provider` field in EIP-712 messages and request bodies.
 * - `verifyVerifierToken` MUST throw on any failure (expired, tampered, wrong issuer,
 *   wrong algorithm, missing claim, ...). The `connect` handler catches and maps the
 *   thrown error to an HTTP 400 with a stable `error` code.
 */
export type ProviderDefinition = {
  name: string;
  verifyVerifierToken: (
    token: string,
    env: IdentityEnv,
  ) => Promise<VerifiedAccount>;
};
