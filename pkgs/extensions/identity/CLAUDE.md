# CLAUDE.md — pkgs/extensions/identity

`@toban/identity` — provider-abstracted Web2 account ↔ wallet binding library for Toban extensions. The repo-root `CLAUDE.md` covers monorepo-wide concerns.

## Responsibility

This package owns **only the binding declaration** ("this Web2 `(provider, account_id)` belongs to this wallet"). It does not own:

- on-chain delegation / mint allowance (those live in the contract layer — `MintAllowanceModule`, issue #506)
- discovery of which guild belongs to which workspace at runtime (consumer Workers do that lookup via `platform_links`)
- frontend `/connect` UX (frontend issue, out of scope here)

The proof model is:

| Proves | Owner | Mechanism |
|---|---|---|
| Wallet possession | Privy | embedded wallet signs EIP-712 |
| Web2 account possession | Provider-specific verifier (Discord bot, GitHub OAuth handler, ...) | ES256 JWT |
| (account_id) ↔ (wallet) declaration | The user, via their wallet | EIP-712 `IdentityBinding` |

→ Privy is **not** an identity oracle here; it is purely a signer. `linkedAccounts` is never consulted.

## Runtime

Cloudflare Workers (no Node-only APIs). All persistence is via a D1 binding passed in from the consumer Worker. The library exposes pure `Request → Promise<Response>` handlers; mounting and routing is the consumer's responsibility.

## Stack

- **viem** — `recoverTypedDataAddress`, `keccak256`, `toBytes`. Worker-safe.
- **jose** — ES256 (P-256 ECDSA) JWT verify via `importSPKI` + `jwtVerify`. Worker-safe.
- **drizzle-orm/d1** — typed queries against D1. Schema lives in `src/schema.ts`; migrations in `migrations/`.
- **vitest** — unit tests run against in-memory `better-sqlite3` using `drizzle-orm/better-sqlite3` (the dialect matches D1, so test queries are representative).

## Layout

```
src/
  eip712/identity-binding.ts   # TypedData types + domain builder + verifierTokenHash helper
  providers/
    types.ts                    # ProviderDefinition / Env contract
    discord.ts                  # ES256 JWT verify against DISCORD_BOT_VERIFIER_PUBLIC_KEY
    index.ts                    # registry: { discord: discordProvider }
  handlers/
    connect.ts                  # POST /api/connect — full verification flow
    lookup.ts                   # GET  /api/lookup?provider=&account_id=
  queries.ts                    # drizzle DB ops (getIdentity, upsertIdentity, ...)
  schema.ts                     # Drizzle table definitions (identities, platformLinks, usedBindingNonces)
  verify.ts                     # recoverIdentityBindingSigner + verifyJwtES256
  index.ts                      # named re-exports
migrations/
  0001_init.sql                  # D1-compatible SQL matching schema.ts byte-for-byte
```

## EIP-712 `IdentityBinding` (boundary contract — do not change without coordinating)

```ts
domain = {
  name: "TobanIdentity",
  version: "1",
  chainId: <signer's network chainId>,
  // no verifyingContract — off-chain use
}
types.IdentityBinding = [
  { name: "wallet",            type: "address" },
  { name: "provider",          type: "string"  },
  { name: "accountId",         type: "string"  },
  { name: "verifierTokenHash", type: "bytes32" },
  { name: "expires",           type: "uint256" },
  { name: "nonce",             type: "bytes32" },
]
verifierTokenHash = keccak256(utf8Bytes(verifier_token))
```

Issuer JWTs (the `verifier_token`) must be **ES256** with claims `{ iss: "toban-discord-bot", provider: "discord", accountId, exp }`. The verify key is read from `env.DISCORD_BOT_VERIFIER_PUBLIC_KEY` as a PEM SPKI string.

## `/api/connect` invariants

Every connect request must satisfy **all** of the following — any single failure returns HTTP 400 with an `error` code:

1. JWT verifies under the provider's public key and is not expired.
2. `typedData.message.provider === provider` (request-level).
3. `typedData.message.accountId === claims.accountId` (JWT-derived).
4. `typedData.message.verifierTokenHash === keccak256(utf8Bytes(verifier_token))`.
5. `recoverTypedDataAddress(typedData, signature)` (lowercased) === `typedData.message.wallet` (lowercased).
6. `typedData.message.expires > now`.
7. `typedData.message.nonce` is not already in `used_binding_nonces`.

The success path performs an atomic-feeling pair of writes (D1 transactions are not yet GA — we order them so that nonce insertion fails on conflict before identity upsert is observed by readers).

## Adding a new provider

1. Create `src/providers/<name>.ts` exporting a `ProviderDefinition` with `verifyVerifierToken`.
2. Register it in `src/providers/index.ts`.
3. Add tests for the verifier (valid + expired + tampered).
4. Document the issuer's JWT shape in this file's boundary section.

**Do not** add provider-specific branches inside `handlers/connect.ts`. That handler is provider-agnostic by design.

## Test approach

Tests live under `src/__tests__/`. They sign real ES256 JWTs and EIP-712 payloads via `jose` and `viem` so the same code paths run as in production; no mocking of cryptographic primitives. The DB layer is exercised against an in-memory SQLite (matching D1's dialect) — `queries.ts` is agnostic to the underlying `BetterSQLite3Database` vs `DrizzleD1Database` choice because both implement the same `SQLiteSyncDialect` / `SQLiteAsyncDialect` query surface.
