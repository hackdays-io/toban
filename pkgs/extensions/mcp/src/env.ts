/**
 * Worker bindings: Cloudflare Workers env shape for `@toban/mcp`.
 *
 * Whether a field is a Workers Secret or a `[vars]` entry is NOT inferable
 * from its name — see the discord-bot `env.ts` note this mirrors. The
 * authoritative split is the secrets comment at the bottom of
 * `wrangler.toml` and `DEPLOYMENT.md` §6-2.
 *
 * NOTE: This Worker holds NO Ethereum private key and no Turnkey stamper
 * credential. It cannot sign anything — writes are always forwarded to
 * `@toban/discord-bot` over the `CONFIRM` binding, which posts a confirm
 * button and stops. See CLAUDE.md's invariants section.
 */
export interface Env {
  // -- bindings -----------------------------------------------------------
  /** D1 database this Worker owns exclusively: the `tbn2` token registry. */
  DB: D1Database;
  /**
   * Service binding to `@toban/identity`, for read-only identity
   * resolution (`discordUserId <-> wallet`). Same-account Workers cannot
   * reach each other over workers.dev (Cloudflare error 1042), so the
   * binding is the only route — see `identity.ts`.
   */
  IDENTITY: Fetcher;
  /**
   * Service binding to `@toban/discord-bot`'s `POST /internal/propose`.
   * This is the *only* way an MCP write tool reaches anything resembling
   * the chain: it asks discord-bot to post a confirm button, and discord-bot
   * decides whether to comply. `@toban/mcp` never calls Turnkey, never signs,
   * and never talks to Discord's REST API directly.
   */
  CONFIRM: Fetcher;

  // -- public vars --------------------------------------------------------
  /** Goldsky subgraph endpoint for the chain in `CHAIN_ID`. */
  GOLDSKY_GRAPHQL_ENDPOINT: string;
  /** Goldsky Hats Protocol subgraph endpoint for the same chain. Used both
   *  by read tools (role context) and by token issuance (hat-wearing check). */
  HATS_GRAPHQL_ENDPOINT: string;
  /** Public frontend URL; used to build permalinks in tool responses. */
  TOBAN_FRONTEND_URL: string;
  /** JSON-RPC endpoint for the chain in `CHAIN_ID`. */
  RPC_URL: string;
  /** EVM chain id as a string (e.g. "8453"). Also the chainId embedded in
   *  the EIP-712 domain for `/api/mcp-tokens` requests. */
  CHAIN_ID: string;
  /**
   * Ethereum address of the Turnkey-managed bot signer (same value as
   * discord-bot's var of the same name — it is public, not a secret).
   * `toban_member_status` reads `mintAllowance(owner, spender)` with this as
   * `spender`, mirroring what the bot itself would be allowed to mint.
   */
  TURNKEY_BOT_SIGNER_ADDRESS: string;

  // -- secrets --------------------------------------------------------------
  /**
   * HMAC key behind the MCP endpoint's `tbn2` bearer tokens (`src/auth.ts`).
   * Moved here from `@toban/discord-bot` as part of the extraction — see
   * `docs/mcp-extraction.md` §8. Mint tokens via `POST /api/mcp-tokens`
   * (self-service) or `pnpm mcp mint-mcp-token` (operator escape hatch).
   */
  MCP_TOKEN_SECRET?: string;
  /**
   * Shared secret sent to the identity Worker on every `GET /api/lookup`-
   * family call (header `x-toban-lookup-secret`). MUST equal the identity
   * worker's value for the same environment, and the discord-bot worker's —
   * all three must agree.
   */
  LOOKUP_READ_SECRET: string;
  /**
   * Shared secret sent to `@toban/discord-bot`'s `POST /internal/propose`
   * (header `x-toban-mcp-propose-secret`). The service binding alone does
   * not close off the plain HTTPS route to that Worker's public URL, so
   * this stops an outsider from posting arbitrary confirm buttons to a
   * Discord channel without ever holding a valid MCP token. MUST equal the
   * discord-bot worker's value for the same environment.
   */
  MCP_INTERNAL_PROPOSE_SECRET: string;
}
