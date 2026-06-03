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
  /**
   * Shared secret required on `POST /api/platform-link`. Set in both the
   * identity Worker and the discord-bot Worker (the only legitimate
   * caller). Absence here means the endpoint is closed entirely — we do
   * not silently fall back to "no auth" because the public CORS surface
   * makes that a write-to-anything endpoint.
   */
  PLATFORM_LINK_WRITE_SECRET?: string;
  /**
   * Comma-separated allowlist of EVM chainIds the worker will accept
   * `IdentityBinding.typedData.domain.chainId` for. Submitting a chainId
   * outside this list yields `domain_mismatch`. Unset means "no
   * restriction" — only acceptable for dev environments.
   */
  ACCEPTED_CHAIN_IDS?: string;
  /**
   * Shared secret required on `GET /api/lookup`. Set in both the identity
   * Worker and consumers (discord-bot, future extensions). Unset means
   * "no auth" — only acceptable for legacy dev configs.
   */
  LOOKUP_READ_SECRET?: string;
  /**
   * RPC endpoint used for EIP-1271 / ERC-6492 signature verification.
   *
   * Privy and other smart-wallet stacks sign typed data with the embedded
   * owner EOA, so a naive `recoverTypedDataAddress` returns the EOA, not the
   * smart wallet that `wallet.account.address` exposes. viem's
   * `publicClient.verifyTypedData` handles all three cases (EOA, EIP-1271
   * contract, ERC-6492 counterfactual) through a single RPC.
   *
   * The chain is taken from `typedData.domain.chainId` at request time; the
   * URL just needs to point to an RPC that supports the chain(s) the worker
   * accepts bindings from. For MVP we run on a single chain (Sepolia in dev,
   * Base in prod), so a single URL is enough.
   */
  RPC_URL?: string;
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
