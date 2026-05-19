/**
 * Worker bindings: Cloudflare Workers env shape.
 *
 * All `*_PRIVATE_KEY` / `*_TOKEN` / `*_SECRET` fields are Workers Secrets
 * (`wrangler secret put <NAME>`), never committed to source. Plain `string`
 * fields are `[vars]` in `wrangler.toml` and may be public.
 *
 * NOTE: This Worker holds NO Ethereum private key. The bot's signing key
 * lives in Turnkey's TEE; the Worker only holds the Turnkey API stamper
 * credentials (which are guarded by Turnkey's policy engine).
 */
export interface Env {
  // -- bindings -----------------------------------------------------------
  /** D1 database shared with @toban/identity for cross-extension lookups. */
  DB: D1Database;
  /**
   * Service binding to the @toban/identity Worker. Use `IDENTITY.fetch(...)`
   * instead of `fetch(IDENTITY_WORKER_URL/...)` — Cloudflare blocks
   * same-account workers.dev cross-Worker fetches (error 1042).
   */
  IDENTITY: Fetcher;

  // -- public vars --------------------------------------------------------
  /**
   * Goldsky subgraph endpoint for the chain in `CHAIN_ID`. Used to look up
   * a workspace's current ThanksToken address from its tree id (the bot
   * never hardcodes a single token address — each workspace can switch
   * implementations independently, see `BigBang.switchThanksToken`).
   */
  GOLDSKY_GRAPHQL_ENDPOINT: string;
  /**
   * Goldsky Hats Protocol subgraph endpoint for the same chain. /thx
   * combines the Toban subgraph's FractionToken balances with the
   * Hats subgraph's "hats this wallet wears" to build the role-context
   * array for `mintFrom`. Freshly-minted hats may not yet be reflected
   * in the Toban subgraph's auto-share-mint indexing, so the Hats path
   * is the authoritative "I'm wearing this" signal.
   */
  HATS_GRAPHQL_ENDPOINT: string;
  /** Public frontend URL; used to construct `/connect/discord?token=...`. */
  TOBAN_FRONTEND_URL: string;
  /**
   * This Worker's own public URL — used as Discord OAuth `redirect_uri`
   * (must exactly match the URL registered in the Discord Developer
   * Portal's OAuth Redirects). Required by /toban-link when handing off
   * the install URL.
   */
  BOT_WORKER_URL: string;
  /** JSON-RPC endpoint (Base mainnet by default). */
  RPC_URL: string;
  /** EVM chain id as a string (e.g. "8453"). */
  CHAIN_ID: string;
  /**
   * Ethereum mainnet JSON-RPC endpoint, used only for ENS resolution
   * (ENS records live on mainnet regardless of the chain the bot's
   * `mintFrom` runs on). Optional — when unset, /thx rejects ENS-form
   * recipients with a clear error.
   */
  MAINNET_RPC_URL?: string;
  /** Turnkey HTTP API base URL (e.g. https://api.turnkey.com). */
  TURNKEY_API_BASE_URL: string;
  /** Turnkey sub-organization id that owns the bot signing key. */
  TURNKEY_ORGANIZATION_ID: string;
  /**
   * Ethereum address of the Turnkey-managed bot signer. Used as the
   * `spender` argument for `mintAllowance` lookups and tx `from` field.
   */
  TURNKEY_BOT_SIGNER_ADDRESS: string;
  /**
   * @toban/identity Worker URL. Used for cross-Worker `/api/lookup`
   * calls to resolve `(provider, accountId) -> wallet`. The two Workers
   * share the same D1, but going through the HTTP API keeps the
   * dependency direction explicit and lets identity own its schema.
   */
  IDENTITY_WORKER_URL: string;

  // -- secrets ------------------------------------------------------------
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  DISCORD_APP_ID: string;
  DISCORD_CLIENT_SECRET: string;
  /** Turnkey API stamper public key (P-256, hex/uncompressed). */
  TURNKEY_API_PUBLIC_KEY: string;
  /** Turnkey API stamper private key (P-256, PEM PKCS8). */
  TURNKEY_API_PRIVATE_KEY: string;
  /** ES256 private key (PEM PKCS8) used to sign verifier_token JWTs. */
  VERIFIER_PRIVATE_KEY: string;
  /** HMAC secret for the short-lived OAuth install state JWT. */
  INSTALL_STATE_SECRET: string;
}
