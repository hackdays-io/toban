# `@toban/discord-bot` (`pkgs/extensions/discord-bot`)

Cloudflare Workers + D1 Discord bot. Provides `/toban-link`, `/toban-setup`,
`/thx`, `/balance`, and `/quest submit`.

## Important invariants

- **No Ethereum private key lives in this Worker.** All on-chain signing
  goes through Turnkey (TEE, AWS Nitro Enclave). The Worker only holds
  Turnkey API stamper credentials (a P-256 key pair) which the Turnkey
  policy engine constrains to two function selectors: ThanksToken `mintFrom`
  (`/thx`) and HatsQuestModule `submitCompletion` (`/quest submit`), with
  `value == 0` on one pinned `chain_id`. Note what is **not** gated:
  `eth.tx.to` is deliberately unconstrained (clones are per-workspace, so
  the allow-list would need editing on every workspace creation), and the
  identity-bound actor argument is not re-checked inside the TEE. See
  `turnkey/policy.json` — `_decisions` for the reasoning, `_gaps` for what
  that leaves open.
- **D1 is shared with `@toban/identity`.** This package never writes
  directly to `identities` / `platform_links`. All identity reads + writes
  go through the identity Worker over the `IDENTITY` **service binding**
  (`env.IDENTITY`), wrapped by `src/identity.ts` — same-account Workers
  cannot reach each other over workers.dev (Cloudflare error 1042), so the
  binding is the only route. `IDENTITY_WORKER_URL` is documentation-only.
  Tests stub the `IdentityClient` interface — do not mock `fetch` for
  identity operations.
- **通知チャンネルの設定は `platform_links.metadata` に入る。**
  `IdentityClient.getNotifyChannelId` / `setNotifyChannelId` を使うこと。
  値の検証（snowflake か）と、他のキーを消さない read-modify-write は
  identity Worker 側が持っている。`metadata` の共有スキーマは
  `pkgs/extensions/identity/CLAUDE.md` の「`platform_links.metadata` のスキーマ」を参照。
  `upsertPlatformLink` は `metadata` を送らないので、再インストールしても
  通知設定は消えない。
- **`src/chain.ts` is the single source of truth for ABI.** It carries
  hand-maintained fragments (`THANKS_TOKEN_ABI`, `HATS_QUEST_MODULE_ABI`)
  rather than importing from `pkgs/contract` — only the slice the bot
  calls. A signature change there also changes the function selector, so
  it must land together with a `turnkey/policy.json` update.
- **`turnkey/policy.json` is the source of truth for the signer's
  allowed operations.** Code can break a policy intent in subtle ways —
  always update the policy file together with the code change that
  changes what the bot can do on-chain. The file holds literal Turnkey
  request parameters; apply it with `./turnkey/apply-policy.sh <base|sepolia>`,
  which picks create vs update so a re-run cannot leave a second, looser
  policy live. It is **not** applied automatically.

## Layout

```
src/
  index.ts                  Workers entry; routes /discord/interactions,
                            /api/install/start and /api/install/callback
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
    quest-submit.ts         /quest submit + `quest` autocomplete handler
    responses.ts            Discord response/followup helpers
  api/install/start.ts      frontend-initiated install entry (signs state)
  api/install/callback.ts   OAuth bot-install callback (binds + registers cmds)
turnkey/
  policy.json               Applicable policy definitions (version-controlled)
  apply-policy.sh           Idempotently applies policy.json to Turnkey
docs/
  turnkey-setup.md          CLI-driven signer / stamper / policy provisioning
  key-rotation.md           scheduled + emergency rotation runbook
test/                       Vitest unit tests (no network, no chain)
```

## Commands

```
pnpm --filter @toban/discord-bot dev                # wrangler dev
pnpm --filter @toban/discord-bot test               # vitest run
pnpm --filter @toban/discord-bot typecheck          # tsc --noEmit
pnpm --filter @toban/discord-bot deploy:dry:sepolia # dry-run (top-level config)
pnpm --filter @toban/discord-bot deploy:sepolia     # → toban-discord-bot       (top-level)
pnpm --filter @toban/discord-bot deploy:base        # → toban-discord-bot-base  (--env base)
```

**Deploying**: read `DEPLOYMENT.md` (repo root) first. Non-obvious constraints:

- **Sepolia is the wrangler top-level config** (worker `toban-discord-bot`); only Base is a named
  env. There is no `[env.sepolia]`.
- **Both envs live in the same Cloudflare account**, separated by worker name and by D1
  (`toban-identity` / `toban-identity-base`) — not by account. The D1s are separate because
  `platform_links` maps guild → treeId, and a treeId only exists on one chain.
- **Deploy `@toban/identity` first** — this worker service-binds to it by name; a missing identity
  worker fails the bot deploy with Cloudflare error 10143.
- There is deliberately **no bare `deploy` script**: `pnpm --filter <pkg> deploy` is pnpm's builtin
  and errors with `ERR_PNPM_INVALID_DEPLOY_TARGET`.
- Adding a command → register it in **both** `scripts/register-commands.ts` and
  `src/api/install/callback.ts`, and re-run `register-commands` for already-installed guilds.

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
