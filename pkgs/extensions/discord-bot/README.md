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

## Deployment

End-to-end deploy involves three external services (Cloudflare, Turnkey, Discord) plus the identity Worker. Deploy identity first ([identity README: Deployment](../identity/README.md#deployment)); this section assumes it's reachable on the same Cloudflare account.

### Step 1 — Cloudflare prerequisites

Same as the identity side — if you already ran `wrangler login` for that package you're done. Re-confirm:

```bash
pnpm --filter @toban/discord-bot exec wrangler whoami
```

### Step 2 — Turnkey: sign-in, signing key, API stamper

Turnkey holds the bot's Ethereum signing key inside a TEE. The Worker only ever holds API stamper credentials (a P-256 key pair) which the policy engine constrains to `mintFrom`-only calls.

1. **Create an account** at https://app.turnkey.com. The free tier covers staging usage.
2. **Note the organization ID** — visible in the dashboard URL or settings (UUID). Goes into `wrangler.toml` as `TURNKEY_ORGANIZATION_ID`.
3. **Create the signing wallet** (the Ethereum address the bot will sign as):
   - Dashboard → **Wallets** → **Create wallet** → name it (e.g. `toban-bot-staging`) → curve: **secp256k1**.
   - Open the wallet → the displayed Ethereum address is `TURNKEY_BOT_SIGNER_ADDRESS`. Fund it with a small amount of native gas on the chain you're targeting (Sepolia for staging).
4. **Create the API stamper key pair** (used by the Worker to authenticate to Turnkey's HTTP API):
   - Dashboard → **API Keys** → **Create API key** → curve: **P-256**. Pick "Generate keypair in browser" so Turnkey shows you the private half once.
   - Copy both halves immediately. The public half is hex (66 chars, prefix `02` / `03` — compressed SEC1). The private is either 64-char hex or a PEM PKCS8 — both work.
5. **Apply the policy** in `turnkey/policy.json` to the API key so it can only authorize `mintFrom` calls on registered ThanksToken contracts. The exact Turnkey UI for policy attach varies by plan; the file is the source of truth either way. See [`docs/turnkey-setup.md`](docs/turnkey-setup.md) for the detailed wizard walk-through, and [`docs/key-rotation.md`](docs/key-rotation.md) for the rotation runbook.

### Step 3 — Discord developer portal

1. Open https://discord.com/developers/applications → **New Application** → name it. The dashboard now shows:
   - **Application ID** → `DISCORD_APP_ID` (`wrangler.toml` var)
   - **Public Key** → `DISCORD_PUBLIC_KEY` (secret) — used by `interactions/verify.ts` for Ed25519 signature checks
2. Left sidebar → **Bot** → **Reset Token** → copy. This is `DISCORD_BOT_TOKEN` (secret). Discord shows it once.
   - Privileged Gateway Intents: leave **off**. The bot is interactions-only; no gateway events.
3. Left sidebar → **OAuth2** → **Reset Secret** → copy. This is `DISCORD_CLIENT_SECRET` (secret) — used by `/api/install/callback` to exchange the OAuth code.
4. **Add an OAuth redirect**:
   ```
   https://toban-discord-bot.<account>.workers.dev/api/install/callback
   ```
   Must match `BOT_WORKER_URL` in `wrangler.toml` (sans trailing slash). If you haven't deployed yet, you can still register the URL now; Discord doesn't verify it until OAuth is used.
5. **Interactions Endpoint URL** — set this **only after** Step 5 (secrets must be in place so the Worker can verify Discord's ping). Same URL pattern: `https://toban-discord-bot.<account>.workers.dev/discord/interactions`.

### Step 4 — Misc supporting values

- `INSTALL_STATE_SECRET` — HMAC key for the short-lived install-state JWT (`/toban-link`-issued, `/api/install/callback`-consumed). Generate fresh:
  ```bash
  openssl rand -hex 32
  ```
- `VERIFIER_PRIVATE_KEY` — the private half of the keypair generated in [identity Step 4](../identity/README.md#step-4--generate-the-verifier-keypair-paired-with-the-bot). Make sure it pairs with the public key you uploaded to identity. Both halves of an ES256 P-256 keypair generated by the same wizard / call are guaranteed to match.
- `MAINNET_RPC_URL` — Ethereum mainnet RPC for ENS resolution in `/thx` (ENS records live on mainnet regardless of chain we mint on). Free tier Alchemy / Infura recommended; some public RPCs reject ENSIP-10 calls.
- `RPC_URL` + `CHAIN_ID` — chain the bot transacts on. Sepolia (`11155111`) for staging, Base (`8453`) for production.
- `GOLDSKY_GRAPHQL_ENDPOINT`, `HATS_GRAPHQL_ENDPOINT` — subgraph URLs for the chain. Sepolia values are in `wrangler.toml`; for Base mainnet swap to the production subgraph URLs (see the deployment targets section in the repo-root `README.md`).
- `IDENTITY_WORKER_URL` — public URL of the identity Worker. Currently used as documentation only (production calls go through the service binding); set it to the identity deploy URL for completeness.

### Step 5 — Set the secrets

In Cloudflare. Multi-line PEM values are safest via the dashboard UI (Workers & Pages → toban-discord-bot → Settings → Variables and Secrets → Add → encrypted); single-line values can be piped:

```bash
cd pkgs/extensions/discord-bot

# Discord
echo -n "<APP_ID>"           | pnpm exec wrangler secret put DISCORD_APP_ID
echo -n "<PUBLIC_KEY hex>"   | pnpm exec wrangler secret put DISCORD_PUBLIC_KEY
echo -n "<BOT_TOKEN>"        | pnpm exec wrangler secret put DISCORD_BOT_TOKEN
echo -n "<CLIENT_SECRET>"    | pnpm exec wrangler secret put DISCORD_CLIENT_SECRET

# Turnkey
echo -n "<API public hex>"   | pnpm exec wrangler secret put TURNKEY_API_PUBLIC_KEY
echo -n "<API private hex>"  | pnpm exec wrangler secret put TURNKEY_API_PRIVATE_KEY
# Verifier (paste the PEM in the dashboard UI):
#   TURNKEY_API_PRIVATE_KEY also accepts PEM PKCS8 if Turnkey gave you that.
pnpm exec wrangler secret put VERIFIER_PRIVATE_KEY \
  < ../identity/.dev-keys/verifier-private.pem   # or production PEM

# Install state
openssl rand -hex 32 | pnpm exec wrangler secret put INSTALL_STATE_SECRET
```

### Step 6 — Fill in `wrangler.toml` vars

Open `pkgs/extensions/discord-bot/wrangler.toml` and set:

```toml
[vars]
GOLDSKY_GRAPHQL_ENDPOINT   = "https://.../toban-<chain>/<version>/gn"
HATS_GRAPHQL_ENDPOINT      = "https://.../hats-v1-<chain>/<version>/gn"
TOBAN_FRONTEND_URL         = "https://toban.xyz"     # or http://localhost:5173 for dev
RPC_URL                    = "https://.../<chain>/<alchemy-key>"
CHAIN_ID                   = "8453"                  # 11155111 for Sepolia
MAINNET_RPC_URL            = "https://eth-mainnet.g.alchemy.com/v2/<key>"
TURNKEY_API_BASE_URL       = "https://api.turnkey.com"
TURNKEY_ORGANIZATION_ID    = "<UUID from Turnkey>"
TURNKEY_BOT_SIGNER_ADDRESS = "0x..."                 # Ethereum address of the Turnkey signing wallet
IDENTITY_WORKER_URL        = "https://toban-identity.<account>.workers.dev"
BOT_WORKER_URL             = "https://toban-discord-bot.<account>.workers.dev"

[[d1_databases]]
database_id = "<same id as identity's D1>"

[[services]]
binding = "IDENTITY"
service = "toban-identity"     # must equal the identity wrangler.toml `name =`
```

### Step 7 — Deploy

```bash
pnpm --filter @toban/discord-bot deploy
```

The output prints the worker URL (`https://toban-discord-bot.<account>.workers.dev`). It should match `BOT_WORKER_URL` in `wrangler.toml` (otherwise the Discord OAuth redirect will mismatch).

### Step 8 — Wire Discord's Interactions Endpoint URL

Back in the Discord developer portal → **General Information** → **Interactions Endpoint URL** → paste:

```
https://toban-discord-bot.<account>.workers.dev/discord/interactions
```

Save. Discord posts a verification ping; the Worker answers with the right signature because `DISCORD_PUBLIC_KEY` is now in place. The portal displays a green check on success.

### Step 9 — Register slash commands per guild

```bash
DISCORD_APP_ID=<id> DISCORD_BOT_TOKEN=<token> \
  pnpm --filter @toban/discord-bot register-commands <guild-id>
```

(Use `read -p` / `read -s -p` to avoid putting the token in your shell history.) This is guild-scoped and propagates instantly. For production-wide rollout, drop the `--guild` segment in `scripts/register-commands.ts` to register globally (~1h propagation).

### Step 10 — Invite the bot to a server

Discord developer portal → **OAuth2** → **URL Generator** → scopes `bot` + `applications.commands` → bot permission `Send Messages` → copy the URL → open in browser → pick a test server → authorise.

The bot is now present in the server. From here the user flow takes over: admin runs `/toban-link <workspace-url>`, members run `/toban-setup`, then `/thx` works. See [Project owner flow](#project-owner-flow-full-sequence) above for the on-the-ground sequence.

### Sanity checks after deploy

```bash
# Worker is up
curl -i https://toban-discord-bot.<account>.workers.dev/anything   # → 404 (only /discord/interactions and /api/install/callback are routed)

# Identity binding is reachable (replace the IDs)
pnpm --filter @toban/identity exec wrangler d1 execute toban-identity --remote \
  --command="SELECT provider, account_id, wallet FROM identities LIMIT 5"

# Bot signer has gas
cast balance <TURNKEY_BOT_SIGNER_ADDRESS> --rpc-url <RPC_URL>
```

If `/thx` reports `Not enough allowance for the bot` even though the user approved, the workspace's ThanksToken might have been redeployed since they last approved — point them at `https://<TOBAN_FRONTEND_URL>/<treeId>/discord-bot` to re-approve against the current signer + contract.

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
