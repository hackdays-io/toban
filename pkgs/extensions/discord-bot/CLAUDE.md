# `@toban/discord-bot` (`pkgs/extensions/discord-bot`)

Cloudflare Workers + D1 Discord bot. Provides `/toban-link`, `/toban-setup`,
`/thx`, `/balance`, and `/quest submit`, plus **`POST /internal/propose`** —
the one seam `@toban/mcp` crosses to reach this package. Discord is, by
design, only a **confirm-button adapter**: `@toban/mcp` is the actual MCP
server (`docs/mcp-extraction.md`), and it holds no signing credential of any
kind. This package is where a proposal becomes a signed transaction.

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
- **An agent can only propose; a click signs.** `@toban/mcp`'s write tools
  (`toban_*_propose`) call this Worker's `POST /internal/propose`, which posts
  a Discord message with a confirm button and stops. Nothing reaches Turnkey
  until a human presses it, and the acting identity is read from
  `interaction.member.user.id` on that **Discord-signed** component
  interaction — never from anything the caller supplied. This is what makes it
  safe to hand an MCP token to an agent we do not run: a hostile proposal can
  at worst show someone a button whose visible text says what pressing it does.
  See `src/internal/propose.ts` and `src/mcp/confirm.ts`.
- **`performThx` / `performQuestSubmit` are the only paths to the chain.**
  Both the slash commands and the confirm button go through them. There must
  never be a second place that builds a `mintFrom` / `submitCompletion` call —
  `turnkey/policy.json` gates those selectors, and two call sites would
  eventually disagree about what gets signed.
- **`POST /internal/propose` is gated by a shared secret, not the MCP bearer
  token.** `@toban/mcp` reaches this route over the `CONFIRM` service
  binding, but a service binding does not stop the same route from also
  being reachable at this Worker's public `workers.dev` URL — the
  `x-toban-mcp-propose-secret` header (checked against
  `MCP_INTERNAL_PROPOSE_SECRET`) is what actually closes that off. This is
  the one secret `docs/mcp-extraction.md`'s migration table does not
  mention; it was added because without it, anyone could post arbitrary
  confirm buttons to any linked channel without ever holding a valid MCP
  token. See `src/internal/propose.ts`'s module doc.
- **The workspace check for `/internal/propose` is reversed from the old
  guild-scoped design.** `@toban/mcp`'s tokens pin a `treeId` (home
  workspace), not a `guildId`, so this endpoint resolves `channelId ->
  guildId` (`discord-rest`) `-> treeId'` (`identity.getPlatformLink`) and
  compares `treeId'` against the request's `treeId` — the same strength as
  the old "token's guild == channel's guild" check, walked in the other
  direction. `ConfirmPayload.guildId` is always the value this Worker
  resolved itself, never one that arrived in the request body.
- **The MCP read surface, the JSON-RPC protocol layer, and the tool
  definitions all live in `@toban/mcp` now — not here.** This package's
  `src/mcp/` holds exactly the pieces that touch `ConfirmPayload`:
  `confirm.ts`, `button.ts`, `discord-rest.ts`. Anything that doesn't touch
  `ConfirmPayload` left with the extraction (`docs/mcp-extraction.md`).
- **Amounts from the indexer are in three incompatible units.** THX is
  18-decimal (`formatEther`, named `*Thx`); role shares are raw counts of a
  fixed 10000-per-role supply (`*Shares`); ScheduledDistributor amounts are
  arbitrary ERC-20 base units whose decimals the subgraph does not index
  (`*Raw`). The suffixes are half the contract with the reading agent; the
  other half is the `units` block every amount-bearing response carries
  (`unitsFor()` in `queries.ts` — field → unit, plus the note for each unit
  used, telling the reader what it may compute with it). **A new amount
  field must be added to its tool's `unitsFor()` call in the same change**,
  or the reader gets a number with no unit. Never "helpfully" divide a
  `*Raw` value: the subgraph does not index ERC-20 decimals, so there is no
  correct divisor to use.
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
- **`src/chain.ts` is the single source of truth for *write* selectors.**
  It carries hand-maintained fragments (`THANKS_TOKEN_ABI`,
  `HATS_QUEST_MODULE_ABI`) rather than importing from `pkgs/contract` — only
  the slice the bot calls. A signature change there also changes the
  function selector, so it must land together with a `turnkey/policy.json`
  update. (`@toban/mcp` keeps its own **view-only** copy of the
  `mintAllowance` / `mintableAmount` fragment for `toban_member_status` — see
  that package's `src/chain.ts`. This is a deliberate, accepted duplication;
  `turnkey/policy.json` only ever gates state-changing selectors, so it does
  not matter that a second Worker can read the same view functions.)
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
internal/
  propose.ts                POST /internal/propose — @toban/mcp's only seam
                             into this package (shared-secret authenticated,
                             reversed workspace check, builds the confirm
                             message)
mcp/
  confirm.ts                proposal <-> embed payload, confirm message
  button.ts                 the click: actor = clicker, then perform*
  discord-rest.ts           bot-token REST calls (channel/message)
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

`mint-mcp-token` used to live here; it moved to `pnpm mcp mint-mcp-token` along
with the rest of the MCP token machinery (`docs/mcp-extraction.md` §8).

**Deploying**: read `DEPLOYMENT.md` (repo root) first. Non-obvious constraints:

- **Sepolia is the wrangler top-level config** (worker `toban-discord-bot`); only Base is a named
  env. There is no `[env.sepolia]`.
- **Both envs live in the same Cloudflare account**, separated by worker name and by D1
  (`toban-identity` / `toban-identity-base`) — not by account. The D1s are separate because
  `platform_links` maps guild → treeId, and a treeId only exists on one chain.
- **Deploy `@toban/identity` first** — this worker service-binds to it by name; a missing identity
  worker fails the bot deploy with Cloudflare error 10143.
- **`@toban/mcp` must deploy *after* this worker** — it service-binds to
  `toban-discord-bot` (the `CONFIRM` binding) to reach `/internal/propose`.
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
- Don't let an MCP tool sign. Writes go through a confirm button, always.
- Don't read the acting user from tool arguments. Only a Discord-signed
  interaction may decide who acts.
- Adding an MCP tool → that happens in `@toban/mcp`, not here. This package
  only grows when a *propose* tool needs a new field on
  `InternalProposeRequest` (`src/internal/propose.ts`) — keep that type and
  `@toban/mcp`'s `import type` of it in sync; a mismatch is a compile error
  in `@toban/mcp`, not a silent bug.
- Don't bypass the identity HTTP boundary by reaching into D1 directly.
- Don't add Discord commands without registering them in the install
  callback (`api/install/callback.ts`).
- Keep secrets out of test fixtures — Ed25519 keypairs in tests are
  generated at runtime via `crypto.subtle.generateKey`.
