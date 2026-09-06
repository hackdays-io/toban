# `@toban/discord-bot` (`pkgs/extensions/discord-bot`)

Cloudflare Workers + D1 Discord bot. Provides `/toban-link`, `/toban-setup`,
`/thx`, `/balance`, and `/quest submit`, plus an **MCP endpoint** (`POST /mcp`)
so any MCP-speaking agent — ours, or a community's own OpenClaw — can drive
Toban without ever holding a signing credential.

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
- **An agent can only propose; a click signs.** The MCP write tools
  (`toban_*_propose`) post a Discord message with a confirm button and stop.
  Nothing reaches Turnkey until a human presses it, and the acting identity is
  read from `interaction.member.user.id` on that **Discord-signed** component
  interaction — never from anything the caller supplied. This is what makes it
  safe to hand a guild token to an agent we do not run: a hostile proposal can
  at worst show someone a button whose visible text says what pressing it does.
  See `src/mcp/confirm.ts`.
- **`performThx` / `performQuestSubmit` are the only paths to the chain.**
  Both the slash commands and the confirm button go through them. There must
  never be a second place that builds a `mintFrom` / `submitCompletion` call —
  `turnkey/policy.json` gates those selectors, and two call sites would
  eventually disagree about what gets signed.
- **MCP tokens pin the guild.** `src/mcp/auth.ts` mints `HMAC(secret, guildId)`,
  so the guild comes from the credential and never from the request body. A
  token for guild A cannot read or propose for guild B whatever the model
  emits. Revocation is currently all-or-nothing (rotate `MCP_TOKEN_SECRET`).
- **D1 is shared with `@toban/identity`.** This package never writes
  directly to `identities` / `platform_links`. All identity reads + writes
  go through the identity Worker over the `IDENTITY` **service binding**
  (`env.IDENTITY`), wrapped by `src/identity.ts` — same-account Workers
  cannot reach each other over workers.dev (Cloudflare error 1042), so the
  binding is the only route. `IDENTITY_WORKER_URL` is documentation-only.
  Tests stub the `IdentityClient` interface — do not mock `fetch` for
  identity operations.
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
mcp/
  index.ts                  POST /mcp entry (auth -> JSON-RPC -> tools)
  auth.ts                   guild-scoped bearer tokens (stateless HMAC)
  protocol.ts               minimal MCP over JSON-RPC 2.0 (no SSE)
  tools.ts                  tool definitions + read/propose handlers
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
pnpm discord-bot mint-mcp-token <guildId>           # MCP token for one guild
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
- Don't let an MCP tool sign. Writes go through a confirm button, always.
- Don't read the acting user from tool arguments. Only a Discord-signed
  interaction may decide who acts.
- Adding an MCP tool → add it to `TOOL_DEFINITIONS` **and** `callTool`, and
  say plainly in its `description` whether it acts or only proposes (the
  description is the only thing a third-party agent reads).
- Don't bypass the identity HTTP boundary by reaching into D1 directly.
- Don't add Discord commands without registering them in the install
  callback (`api/install/callback.ts`).
- Keep secrets out of test fixtures — Ed25519 keypairs in tests are
  generated at runtime via `crypto.subtle.generateKey`.
