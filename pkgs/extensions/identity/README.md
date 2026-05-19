# `@toban/identity`

A Cloudflare Worker that owns the **off-chain "this Web2 account belongs to this wallet"** binding for Toban. It exposes four HTTP endpoints, persists state in a Cloudflare D1 database, and is provider-abstracted so additional integrations (Slack, GitHub, …) can be added without touching the connect flow.

The Worker is the canonical source for two things:

1. **Identity** — `(provider, account_id) → wallet`, populated when a user signs an EIP-712 `IdentityBinding` with their wallet.
2. **Platform link** — `(provider, platform_id) → tree_id`, populated when a workspace admin installs the corresponding extension (e.g. invites the Discord bot and runs `/toban-link`).

The MVP ships with the `discord` provider only. The companion extension is [`@toban/discord-bot`](../discord-bot/README.md), which is the only client of the writeback endpoints today and forwards user actions into this Worker over a Cloudflare service binding. Reading this README is enough to understand and operate the Worker; pointers to the bot doc explain *who triggers each call* without duplicating that doc's interaction details.

## TL;DR

```
admin (Discord)  /toban-link  →  POST  /api/platform-link
member           /toban-setup →  DM URL → frontend signs → POST /api/connect
                                                      → identities row
member (Discord) /thx         →  GET   /api/lookup ×2  (sender + recipient)
                              →  GET   /api/platform-link  (resolve workspace)
```

Every state mutation comes from a flow described below; lookups are pure reads.

## Project owner flow (full sequence)

This is the same sequence captured in [discord-bot README](../discord-bot/README.md#project-owner-flow-full-sequence), expressed from this Worker's vantage point. Either doc reads standalone.

### 1. The bot is invited to a Discord server

No interaction with this Worker yet — the bot is just present in the guild and listening on Discord's interactions endpoint.

### 2. Identity binding — `/toban-setup` → `/connect/discord` → `POST /api/connect`

The discord-bot issues an ES256 verifier_token JWT for the calling Discord snowflake and DMs the user a `https://toban.xyz/connect/discord?token=<jwt>&treeId=<tree>` link. The frontend handles wallet login and EIP-712 signing.

The frontend then POSTs to this Worker:

```http
POST /api/connect
Content-Type: application/json

{
  "provider": "discord",
  "verifier_token": "<ES256 JWT>",
  "identity_binding": {
    "typedData": {
      "domain":      { "name": "TobanIdentity", "version": "1", "chainId": <number> },
      "types":       { "IdentityBinding": [ /* see below */ ] },
      "primaryType": "IdentityBinding",
      "message":     {
        "wallet":            "<address>",
        "provider":          "discord",
        "accountId":         "<discord snowflake>",
        "verifierTokenHash": "<bytes32>",
        "expires":           <unix seconds>,
        "nonce":             "<bytes32>"
      }
    },
    "signature": "0x…"
  }
}
```

The handler in `src/handlers/connect.ts` runs the checks in cheap-first order and short-circuits on the first failure with a stable `{ error: <code> }` JSON 400. Codes are listed in `ConnectErrorCode`; the frontend already knows how to render each.

Validation invariants — every connect request must satisfy **all** of these:

1. JWT verifies under the configured `DISCORD_BOT_VERIFIER_PUBLIC_KEY` (ES256, P-256 SPKI PEM) and isn't expired (claim `exp`).
2. `typedData.message.provider === provider` (request-level).
3. `typedData.message.accountId === claims.accountId` (JWT-derived).
4. `typedData.message.verifierTokenHash === keccak256(utf8Bytes(verifier_token))`.
5. EIP-712 signature verifies for `typedData.message.wallet`. This goes through viem's `publicClient.verifyTypedData(env.RPC_URL)`, which uniformly handles EOA recover, EIP-1271 smart accounts (Privy embedded smart wallets fall in here), and ERC-6492 counterfactual signatures.
6. `typedData.message.expires > now`.
7. `typedData.message.nonce` is not already in `used_binding_nonces`.

On success the handler atomically writes the `(provider, account_id) → wallet` row in `identities` and the nonce in `used_binding_nonces`. Re-binding the same Web2 account to a different wallet is allowed and overwrites `wallet` + `updated_at`. The original `created_at` is preserved.

The EIP-712 type fixture (kept in sync with the discord-bot and the frontend `/connect/discord` page):

```ts
domain: {
  name: "TobanIdentity",
  version: "1",
  chainId: <signer's network chainId>,
  // no verifyingContract — off-chain use
}
types: {
  IdentityBinding: [
    { name: "wallet",            type: "address" },
    { name: "provider",          type: "string"  },
    { name: "accountId",         type: "string"  },
    { name: "verifierTokenHash", type: "bytes32" },
    { name: "expires",           type: "uint256" },
    { name: "nonce",             type: "bytes32" },
  ],
}
```

How the bot issues the JWT and how the frontend builds the typedData are documented in [discord-bot README: identity binding](../discord-bot/README.md#3-each-member-binds-their-discord-account-to-a-wallet).

### 3. Server-to-workspace binding — `/toban-link` → `POST /api/platform-link`

After binding their wallet, the admin runs `/toban-link <workspace-url>` in the linked Discord server. The bot calls this Worker via the service binding:

```http
POST /api/platform-link
Content-Type: application/json

{
  "provider":    "discord",
  "platformId":  "<guild_id>",        // also accepts platform_id
  "treeId":      "<workspace tree id, decimal string>",
  "installedBy": "<address of installer>",
  "metadata":    { ... }              // optional, JSON object or string
}
```

The handler upserts a row in `platform_links`. On conflict (`provider, platform_id`), it updates `tree_id`, `installed_by`, and `metadata` — useful if the workspace is later switched to a different tree without re-installing the bot.

### 4. THX flow — `/thx` → `/api/lookup`s + `/api/platform-link`

`/thx amount user:@bob` causes the bot to make three reads against this Worker:

```http
GET /api/lookup?provider=discord&account_id=<sender snowflake>
GET /api/lookup?provider=discord&account_id=<recipient snowflake>
GET /api/platform-link?provider=discord&platform_id=<guild_id>
```

`/api/lookup` returns `{ "wallet": "0x…", "metadata"?: object }` (200) or `{ "error": "not_found" }` (404).
`/api/platform-link` returns `{ provider, platformId, treeId, installedBy, metadata? }` (200) or `{ "error": "not_found" }` (404).

If the recipient is supplied via `address:` (raw `0x…` or ENS) instead of a Discord user, the bot bypasses the recipient lookup — see [discord-bot README: members send THX](../discord-bot/README.md#5-members-send-thx).

This Worker is purely a read at `/thx` time. All on-chain action lives in the bot.

## HTTP surface

| Path | Method | Body / Query | Response | Source |
|---|---|---|---|---|
| `/api/connect` | POST | `{ provider, verifier_token, identity_binding }` | 200 `{ ok: true }` / 400 `{ error, details? }` | `handlers/connect.ts` |
| `/api/lookup` | GET | `?provider&account_id` (or `accountId`) | 200 `{ wallet, metadata? }` / 404 `{ error: "not_found" }` | `handlers/lookup.ts` |
| `/api/platform-link` | GET | `?provider&platform_id` (or `platformId`) | 200 `{ provider, platformId, treeId, installedBy, metadata? }` / 404 | `handlers/platform-link.ts` |
| `/api/platform-link` | POST | `{ provider, platformId, treeId, installedBy, metadata? }` | 200 `{ ok: true }` | `handlers/platform-link.ts` |
| `/health` | GET | — | 200 `{ ok: true }` | `worker.ts` |

CORS allows any origin on `/api/*`; auth comes from the cryptographic proofs in the request bodies (JWT + EIP-712), not from origin.

## D1 schema

```sql
-- (provider, account_id) → wallet
CREATE TABLE identities (
  provider     TEXT NOT NULL,
  account_id   TEXT NOT NULL,
  wallet       TEXT NOT NULL,           -- checksum address (mixed case preserved)
  metadata     TEXT,                    -- JSON string, provider-specific
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (provider, account_id)
);
CREATE INDEX idx_identities_wallet ON identities(wallet);

-- (provider, platform_id) → tree_id
CREATE TABLE platform_links (
  provider     TEXT NOT NULL,
  platform_id  TEXT NOT NULL,
  tree_id      TEXT NOT NULL,
  installed_by TEXT NOT NULL,
  metadata     TEXT,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (provider, platform_id)
);
CREATE INDEX idx_platform_links_tree ON platform_links(tree_id);

-- replay protection for IdentityBinding signatures
CREATE TABLE used_binding_nonces (
  nonce        BLOB PRIMARY KEY,
  used_at      INTEGER NOT NULL
);
```

Apply via `pnpm --filter @toban/identity db:migrate:local` (Miniflare-backed local D1) or `db:migrate:remote` (deployed D1).

## Layout

```
src/
  worker.ts                       fetch entry — routes /api/* and /health
  schema.ts                       Drizzle definitions for identities,
                                  platform_links, used_binding_nonces
  queries.ts                      Drizzle helpers (getIdentity, upsert*, etc.)
  eip712/identity-binding.ts      Typed-data definition + verifierTokenHash
  verify.ts                       recoverIdentityBindingSigner +
                                  verifyIdentityBindingViaRpc +
                                  verifyJwtES256
  providers/
    types.ts                      ProviderDefinition / IdentityEnv contract
    discord.ts                    ES256 JWT verify against
                                  DISCORD_BOT_VERIFIER_PUBLIC_KEY
    index.ts                      registry: { discord: discordProvider }
  handlers/
    connect.ts                    POST /api/connect — full verification flow
    lookup.ts                     GET  /api/lookup
    platform-link.ts              GET/POST /api/platform-link
  __tests__/                      vitest suites (real JWT + EIP-712 fixtures)
migrations/
  0001_init.sql                   D1-compatible SQL, byte-for-byte schema.ts
scripts/
  dev-token.ts                    One-off helper: generate a P-256 verifier
                                  keypair (under .dev-keys/) and issue a
                                  signed verifier_token for local testing
```

## Stack

- **Cloudflare Workers** runtime (no Node-only APIs). The CLAUDE.md in this directory enumerates allowed deps.
- **viem** — `recoverTypedDataAddress`, `publicClient.verifyTypedData`, `keccak256`. Worker-safe.
- **jose** — ES256 JWT verify via `importSPKI` + `jwtVerify`. Worker-safe.
- **drizzle-orm/d1** — typed queries against D1. The same `queries.ts` runs against in-memory `better-sqlite3` in tests.
- **vitest** — unit tests sign real ES256 JWTs and EIP-712 payloads so production code paths are exercised end-to-end.

## Commands

```
pnpm --filter @toban/identity dev              # wrangler dev (Miniflare)
pnpm --filter @toban/identity test             # vitest run
pnpm --filter @toban/identity typecheck        # tsc --noEmit
pnpm --filter @toban/identity deploy           # wrangler deploy
pnpm --filter @toban/identity deploy:dry       # wrangler deploy --dry-run
pnpm --filter @toban/identity db:migrate:local
pnpm --filter @toban/identity db:migrate:remote
pnpm --filter @toban/identity dev-token --snowflake <id> --tree-id <tree>
```

`dev-token` is the local-dev shortcut for issuing a verifier_token without running the bot Worker. It generates a fresh P-256 keypair on first invocation, writes the matching SPKI public key plus a Sepolia RPC URL into `.dev.vars` (gitignored), and prints both the bare JWT (stdout) and a copy-pasteable `/connect/discord?token=…` URL (stderr).

## Adding a new provider

1. Create `src/providers/<name>.ts` exporting a `ProviderDefinition` with `verifyVerifierToken`. The default JWT verifier in `verify.ts` is reusable for any ES256 issuer.
2. Register it in `src/providers/index.ts`.
3. Add tests that cover the verifier (valid + expired + tampered token + wrong issuer).
4. Document the new provider's issuer + token format here.

`handlers/connect.ts` is provider-agnostic by design — do not add provider-specific branches there.

## Important invariants

- **Privy is not an identity oracle.** The frontend uses Privy only to obtain a wallet that can sign EIP-712 — `linkedAccounts` is never consulted here.
- **The Discord bot is not authoritative.** It is one (privileged) caller of this Worker. New extensions are first-class peers, not children.
- **Wallet is stored in checksum form** so callers don't re-checksum on every read.
- **Nonces are stored as BLOBs.** The PRIMARY KEY on `nonce` enforces single-use; the handler also pre-checks via `isNonceUsed` so duplicates return a `nonce_reused` error code rather than a constraint violation.
- **No D1 transactions** (D1 transactions are not GA): the connect handler orders writes so the nonce insertion fails on conflict before the identity upsert becomes visible to readers.
