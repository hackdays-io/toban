# `@toban/discord-bot` (`pkgs/extensions/discord-bot`)

Cloudflare Workers + D1 Discord bot. Provides `/toban-link`, `/toban-setup`,
`/thx`, and `/balance`.

## Important invariants

- **No Ethereum private key lives in this Worker.** All on-chain signing
  goes through Turnkey (TEE, AWS Nitro Enclave). The Worker only holds
  Turnkey API stamper credentials (a P-256 key pair) which the Turnkey
  policy engine constrains to `mintFrom`-only calls.
- **D1 is shared with `@toban/identity`.** This package never writes
  directly to `identity_bindings` / `platform_links`. All identity
  reads + writes go through the identity Worker's HTTP API
  (`IDENTITY_WORKER_URL` env), wrapped by `src/identity.ts`. Tests stub
  the `IdentityClient` interface — do not mock `fetch` for identity
  operations.
- **`src/chain.ts` is the single source of truth for ABI.** Until #506
  lands, `THANKS_TOKEN_ABI` is a placeholder fragment with TODO comments.
  When you swap it for the real ABI, only this file should change.
- **`turnkey/policy.json` is the source of truth for the signer's
  allowed operations.** Code can break a policy intent in subtle ways —
  always update the policy file together with the code change that
  changes what the bot can do on-chain.

## Layout

```
src/
  index.ts                  Workers entry; routes /discord/interactions
                            and /api/install/callback
  env.ts                    Env / bindings type
  interactions/verify.ts    Ed25519 verification (crypto.subtle, no
                            tweetnacl)
  verifier.ts               ES256 verifier_token issuer (for /toban-setup)
  chain.ts                  viem client + ThanksToken ABI fragment
  identity.ts               IdentityClient interface + HTTP impl
  signer/turnkey.ts         Turnkey API stamper auth + LocalAccount wrapper
  commands/
    toban-setup.ts
    toban-link.ts
    balance.ts
    thx.ts                  /thx end-to-end (resolve, check, sign, send)
    responses.ts            Discord response/followup helpers
  api/install/callback.ts   OAuth bot-install callback
turnkey/policy.json         Declarative policy stub (version-controlled)
docs/
  turnkey-setup.md          dev/prod sub-org + stamper provisioning
  key-rotation.md           scheduled + emergency rotation runbook
test/                       Vitest unit tests (no network, no chain)
```

## Commands

```
pnpm --filter @toban/discord-bot dev          # wrangler dev
pnpm --filter @toban/discord-bot test         # vitest run
pnpm --filter @toban/discord-bot typecheck    # tsc --noEmit
pnpm --filter @toban/discord-bot deploy:dry   # wrangler deploy --dry-run
pnpm --filter @toban/discord-bot deploy       # wrangler deploy
```

## Runtime constraints

- Workers runtime, not Node. Use `crypto.subtle` (WebCrypto) for keys;
  avoid Node-only modules. Allowed deps so far:
  - `viem` (browser+workers compatible)
  - `jose` (WebCrypto under the hood; works on Workers)
  - `discord-api-types` (types only)
- We rely on Ed25519 in `crypto.subtle.{importKey, verify}`; this requires
  a reasonably recent compatibility date (`2026-01-01` set in
  `wrangler.toml`). Older dates may need a polyfill.
- `nodejs_compat` is enabled for `Buffer` and the like; keep its use to
  a minimum.

## When making changes

- Don't introduce a new private-key store. All signing is Turnkey.
- Don't bypass the identity HTTP boundary by reaching into D1 directly.
- Don't add Discord commands without registering them in the install
  callback (`api/install/callback.ts`).
- Keep secrets out of test fixtures — Ed25519 keypairs in tests are
  generated at runtime via `crypto.subtle.generateKey`.
