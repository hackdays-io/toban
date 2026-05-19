# `@toban/discord-bot`

A Cloudflare Worker that runs the **Toban Discord bot** — it answers Discord slash commands (`/toban-link`, `/toban-setup`, `/balance`, `/thx`) and triggers on-chain ThanksToken mints on behalf of the caller. The bot holds **zero** Ethereum private keys; every `mintFrom` transaction is signed by a key kept inside Turnkey's TEE and gated by Turnkey's policy engine.

The bot pairs with [`@toban/identity`](../identity/README.md), which owns the `(Discord snowflake) ↔ wallet` and `(Discord guild) ↔ Toban workspace` bindings. Reading this README is enough to operate the bot, but the identity sequence in particular leans on the identity Worker doing its part — links to that doc are inline.

## TL;DR

```
admin invites bot to guild
admin runs   /toban-link <workspace-url>   →   guild ↔ workspace bound
each member  /toban-setup                  →   Discord snowflake ↔ wallet bound
                                               approves the bot for an allowance
                                               in /<treeId>/discord-bot
anyone       /thx amount user:@…           →   on-chain mintFrom signed by Turnkey
```

Each step is broken down below with the boundary contracts the bot relies on.

## Project owner flow (full sequence)

### 0. Prerequisites (one-time)

- Workspace already exists. The bot needs a Toban workspace it can point at — i.e. someone has run `pnpm contract bigbang` (or equivalent on the frontend) so a `BigBang.Executed` event exists and the Toban subgraph has indexed a `Workspace` entity with a `thanksToken` field.
- Bot Worker is deployed. `wrangler deploy` from this package + secrets set in Cloudflare (see [`docs/turnkey-setup.md`](docs/turnkey-setup.md) and [`docs/key-rotation.md`](docs/key-rotation.md) for the Turnkey side; `wrangler.toml` lists every `[vars]` and `# secrets:` entry).
- Identity Worker is deployed and reachable through the **service binding** named `IDENTITY` (see `wrangler.toml`). Same-account Workers can't fetch each other through workers.dev (Cloudflare error 1042); the binding is the only supported path.
- Discord application is registered (developer portal) with:
  - `Interactions Endpoint URL` → `https://<bot-worker>/discord/interactions`
  - `OAuth2 Redirects` → `https://<bot-worker>/api/install/callback`
- Slash commands are registered for the target guild:
  ```bash
  DISCORD_APP_ID=… DISCORD_BOT_TOKEN=… \
    pnpm --filter @toban/discord-bot register-commands <guild-id>
  ```
  `scripts/register-commands.ts` is the source of truth for the command spec.

### 1. Invite the bot to your Discord server

The project owner opens the OAuth invite URL generated in the Discord developer portal (scopes `bot` + `applications.commands`, minimal permissions — `Send Messages` is enough), picks the target server, and authorises. From this point the bot sits in the server but doesn't know which Toban workspace this server represents.

### 2. Link the server to a Toban workspace

Inside the server, the admin types:

```
/toban-link workspace_url:https://toban.xyz/<treeId>
```

The bot:

1. Extracts the `treeId` from the URL (`/<treeId>` segment).
2. Resolves the caller's Discord snowflake to a wallet via `IDENTITY.fetch('/api/lookup?provider=discord&account_id=…')`. If the caller hasn't onboarded yet (i.e. no identity binding), the bot answers `Run /toban-setup first` — see step 3.
3. POSTs the link `(provider=discord, platform_id=guild_id, tree_id, installed_by=caller.wallet)` to the identity Worker via `IDENTITY.fetch('/api/platform-link', { method: 'POST', body })`.
4. Replies ephemerally with `✅ Linked this server to Toban workspace <tree>.`

Internally the identity Worker upserts the `platform_links` row — see [identity README: workspace binding](../identity/README.md#3-server-to-workspace-binding) for the wire format and table schema.

> **Admin Hat check is TODO.** Today the bot trusts the URL-bearer; a hardened version will verify that the caller's wallet wears the workspace's admin Hat on-chain before writing the binding. The OAuth-based install path (`/api/install/callback`) has the same TODO marker.

### 3. Each member binds their Discord account to a wallet

The member types `/toban-setup` in any channel of the linked guild.

The bot:

1. Issues a short-lived **verifier_token** — an ES256 JWT signed with `VERIFIER_PRIVATE_KEY` (Turnkey or Workers Secret-managed). Claims: `{ iss: "toban-discord-bot", provider: "discord", accountId: <snowflake>, exp: now+15min }`. See `src/verifier.ts`.
2. Looks up the guild's `platform_links` row to pick up the `tree_id` so the frontend can hand the user straight to their workspace allowance page after onboarding.
3. Sends an ephemeral DM:
   ```
   Open this link in your browser within 15 minutes to connect your wallet:
   https://toban.xyz/connect/discord?token=<jwt>&treeId=<treeId>
   ```

The link drops the user on the Toban frontend's `/connect/discord` page, where they:

1. Privy-login → get an embedded smart wallet.
2. Sign an EIP-712 `IdentityBinding` (`{ wallet, provider, accountId, verifierTokenHash, expires, nonce }`).
3. POST the verifier_token + signed binding to identity's `/api/connect`.

The identity Worker checks the JWT (against `DISCORD_BOT_VERIFIER_PUBLIC_KEY`), checks the EIP-712 signature (via `publicClient.verifyTypedData`, which handles EOA / EIP-1271 smart wallet / ERC-6492 counterfactual uniformly), and upserts `(discord, snowflake) → wallet` in `identities`. Full details in [identity README: identity binding](../identity/README.md#2-identity-binding-toban-setup--connectdiscord).

After the binding lands, the frontend pushes the user to `/<treeId>/discord-bot`, where they call `approveMint(<bot-signer-address>, amount)` on the workspace's ThanksToken. This is the only on-chain action the user takes outside of `/thx` itself. The bot will read this allowance every time it tries to mint on their behalf.

### 4. Bot signer setup (one-time per environment)

The bot signs `mintFrom` transactions with a **Turnkey-managed Ethereum key**. The Worker only holds Turnkey API stamper credentials (a P-256 key pair). Operational guides:

- [`docs/turnkey-setup.md`](docs/turnkey-setup.md) — creating the sub-org, signing key, API stamper, applying the policy (`turnkey/policy.json`).
- [`docs/key-rotation.md`](docs/key-rotation.md) — scheduled + emergency rotation runbooks.

Fund the resulting signer address (`TURNKEY_BOT_SIGNER_ADDRESS`) with a small amount of native gas on the target chain. Everything else flows from there.

### 5. Members send THX

```
/thx amount:5 user:@bob [address:0x… or vitalik.eth] [message:thanks]
```

`amount` and `user` are required; `address` overrides `user.wallet` so a member can redirect THX to any address (including an ENS name) even if the recipient hasn't run `/toban-setup`. Steps the bot performs (see `src/commands/thx.ts`):

1. **Resolve the sender's wallet.** `IDENTITY.fetch('/api/lookup', …)` against the caller's snowflake; rejects with `You haven't linked a wallet. Run /toban-setup first.` if missing.
2. **Resolve the guild's workspace.** Same identity API, this time `platform_links` lookup; rejects with `…ask an admin to run /toban-link first` if absent.
3. **Resolve the recipient's wallet.**
   - If `address` is `0x…`: validate and use as-is.
   - If `address` is `*.eth`: ENS resolve on Ethereum mainnet (`env.MAINNET_RPC_URL`) — ENS records live on mainnet regardless of the chain we mint on.
   - Otherwise: `IDENTITY.fetch('/api/lookup', …)` for the picked Discord user.
4. **Resolve the current ThanksToken address.** The bot never hardcodes a token address — each workspace owns its own clone and can switch implementations independently. The bot reads `Workspace.thanksToken.id` from `GOLDSKY_GRAPHQL_ENDPOINT`.
5. **Read `mintAllowance(sender, botSigner)`** on-chain. If insufficient, follow up with a link to `/<treeId>/discord-bot` so the sender can top it up.
6. **Build `relatedRoles`.** ThanksToken's `mintableAmount` formula is driven by FractionToken share balances and hat wear time. The bot queries:
   - Toban subgraph (`balanceOfFractionTokens` filtered by `owner, workspaceId`),
   - Hats subgraph (`tree(id).hats[wearers.id == sender]`),
   and merges them into the `(hatId, wearer)[]` array the contract expects.
7. **Sign `mintFrom(sender, recipient, amount * 1e18, relatedRoles, data)` via Turnkey** and broadcast through `env.RPC_URL`.
8. **Follow up** in Discord with the tx hash + amount + recipient.

`amount` from the Discord INTEGER option is scaled by `1e18` inside the bot (ThanksToken is an 18-decimal ERC-20); `/balance` reports values in human-readable THX via `formatEther`.

## Bot ↔ identity wire contract (cheat sheet)

| Operation | Direction | Endpoint | Notes |
|---|---|---|---|
| Issue verifier_token | bot internal | `src/verifier.ts` (ES256 JWT) | Identity worker verifies with `DISCORD_BOT_VERIFIER_PUBLIC_KEY` |
| Look up wallet by snowflake | bot → identity | `GET /api/lookup?provider&account_id` | 404 = unbound |
| Look up workspace by guild | bot → identity | `GET /api/platform-link?provider&platform_id` | 404 = unlinked |
| Bind workspace to guild | bot → identity | `POST /api/platform-link` | Body: `{ provider, platformId, treeId, installedBy }` |
| Bind wallet to snowflake | frontend → identity | `POST /api/connect` | Bot is not involved — see identity README |

All bot → identity calls go through `env.IDENTITY.fetch(...)` (service binding). See [identity README: HTTP surface](../identity/README.md#http-surface) for shapes.

## Layout

```
src/
  index.ts                  Workers entry; routes /discord/interactions
                            and /api/install/callback
  env.ts                    Env / bindings type
  interactions/verify.ts    Ed25519 verification (crypto.subtle, no
                            tweetnacl)
  verifier.ts               ES256 verifier_token issuer (for /toban-setup)
  chain.ts                  viem client + ThanksToken ABI fragment +
                            subgraph resolvers (ThanksToken address per
                            workspace, relatedRoles, ENS)
  identity.ts               IdentityClient interface + service-binding
                            HTTP client
  signer/turnkey.ts         Turnkey API stamper auth + LocalAccount wrapper
  commands/
    toban-setup.ts          Issue verifier_token + DM link
    toban-link.ts           Bind guild → tree_id directly
    balance.ts              Show mintAllowance + mintable budget (THX)
    thx.ts                  /thx end-to-end (resolve, check, sign, send)
    responses.ts            Discord response/followup helpers
  api/install/callback.ts   OAuth bot-install callback (frontend-initiated
                            flow)
turnkey/policy.json         Declarative policy stub (version-controlled)
docs/
  turnkey-setup.md          dev/prod sub-org + stamper provisioning
  key-rotation.md           scheduled + emergency rotation runbook
scripts/
  register-commands.ts      One-off Discord slash-command registration
test/                       Vitest unit tests (no network, no chain)
```

## Commands

```
pnpm --filter @toban/discord-bot dev               # wrangler dev (local)
pnpm --filter @toban/discord-bot test              # vitest run
pnpm --filter @toban/discord-bot typecheck         # tsc --noEmit
pnpm --filter @toban/discord-bot deploy            # wrangler deploy
pnpm --filter @toban/discord-bot deploy:dry        # wrangler deploy --dry-run
pnpm --filter @toban/discord-bot register-commands <guild>
```

## Important invariants

- **No Ethereum private key lives in this Worker.** All on-chain signing goes through Turnkey (TEE, AWS Nitro Enclave). The Worker only holds Turnkey API stamper credentials (a P-256 key pair), constrained by `turnkey/policy.json`.
- **D1 is shared with `@toban/identity`.** This package never writes directly to `identities` / `platform_links`. Every identity operation goes through the identity Worker's HTTP API, accessed through the `IDENTITY` service binding.
- **`src/chain.ts` is the single source of truth for the ThanksToken ABI fragment.** When the contract evolves, only this file should change.
- **`turnkey/policy.json` is the source of truth for what the signer can do on-chain.** Code changes that broaden the signer's surface MUST be paired with a policy update.

## Runtime constraints

- Workers runtime, not Node. Use `crypto.subtle` (WebCrypto) for keys; avoid Node-only modules. Allowed deps so far: `viem`, `jose`, `discord-api-types` (types only).
- Ed25519 in `crypto.subtle.{importKey, verify}` requires a recent compatibility date — `wrangler.toml` sets `2026-01-01`.
- `nodejs_compat` is enabled (mainly for `Buffer`); keep its use to a minimum.

## When making changes

- Don't introduce a new private-key store. All signing is Turnkey.
- Don't bypass the identity HTTP boundary by reading D1 directly.
- Don't hardcode the ThanksToken address — resolve via subgraph per workspace.
- Don't add a Discord command without registering it via `scripts/register-commands.ts` (and, for frontend-initiated installs, in `api/install/callback.ts`'s `COMMANDS_PAYLOAD`).
- Keep secrets out of test fixtures — Ed25519 keypairs in tests are generated at runtime via `crypto.subtle.generateKey`.
