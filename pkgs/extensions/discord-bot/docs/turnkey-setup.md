# Turnkey setup

This bot's Ethereum signing key lives in Turnkey's sub-organization
(TEE / AWS Nitro Enclave). The Worker never sees the private key — it
only holds API stamper credentials that the Turnkey policy engine
constrains to `mintFrom`-only calls.

Two environments: **dev** and **prod**. Each is a *separate* Turnkey
sub-organization with separate signing keys, separate stamper key pairs,
and a separate copy of `turnkey/policy.json` applied.

## Prerequisites

- A Turnkey root org account with permission to create sub-orgs.
- `turnkey-cli` (or the Turnkey console) for the manual steps below.
- This repo cloned, `wrangler` installed (`pnpm install` at repo root).

## 1. Create a sub-organization (per environment)

In the Turnkey console:

1. **Organizations -> Create sub-organization** with name e.g.
   `toban-discord-bot-dev` or `toban-discord-bot-prod`.
2. Add maintainers as members; nobody should have raw "export key"
   permission. Use Quorum for sensitive actions if available.
3. Note the sub-org id — this is `TURNKEY_ORGANIZATION_ID`.

## 2. Generate the signing key

Inside the sub-org:

1. **Wallets -> Create wallet -> Ethereum**.
2. Take the resulting address — this is `TURNKEY_BOT_SIGNER_ADDRESS`.
3. **Do NOT export the private key**. There is no recovery path; this
   is the point. If the key needs replacing, follow `key-rotation.md`.

## 3. Generate the API stamper key pair

The stamper is how this Worker proves to Turnkey "I'm allowed to ask
for signatures."

1. Locally (one-time, ideally on a hardware-protected dev box):
   ```bash
   openssl ecparam -name prime256v1 -genkey -noout -out stamper.key.pem
   openssl ec -in stamper.key.pem -pubout -out stamper.pub.pem
   # Public key as hex for Turnkey upload:
   openssl ec -in stamper.key.pem -pubout -outform DER 2>/dev/null \
     | tail -c 65 | xxd -p -c 130
   ```
2. In the Turnkey console under the sub-org **API users -> Create**,
   upload the public key hex from above. This binds the stamper to the
   sub-org.
3. Store `stamper.key.pem` and the public-key hex temporarily in a
   secure location (1Password etc). They will be uploaded as Workers
   Secrets in step 5 and then deleted from the local disk.

## 4. Apply the policy

`turnkey/policy.json` in this repo is the source of truth. Before
applying, replace the `selector` placeholder with the real `mintFrom`
selector once `pkgs/contract` (#506) lands.

```bash
# Pseudocode — actual command depends on turnkey-cli version.
turnkey policy create \
  --organization-id $TURNKEY_ORGANIZATION_ID \
  --policy-name toban-discord-bot-mintFrom-only \
  --policy turnkey/policy.json
turnkey policy attach \
  --organization-id $TURNKEY_ORGANIZATION_ID \
  --signing-key-name discord-bot-signer \
  --policy-name toban-discord-bot-mintFrom-only
```

Tag sets referenced by the policy (`toban-thanks-token-registry`,
`toban-identity-bound-wallets`) must also exist. For MVP we seed them
with a single entry; a follow-up issue will add a subgraph-driven
sync cron.

## 5. Upload Worker secrets

```bash
# Dev environment
pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PUBLIC_KEY
pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PRIVATE_KEY  # paste PEM
pnpm --filter @toban/discord-bot exec wrangler secret put DISCORD_PUBLIC_KEY
pnpm --filter @toban/discord-bot exec wrangler secret put DISCORD_BOT_TOKEN
pnpm --filter @toban/discord-bot exec wrangler secret put DISCORD_APP_ID
pnpm --filter @toban/discord-bot exec wrangler secret put DISCORD_CLIENT_SECRET
pnpm --filter @toban/discord-bot exec wrangler secret put VERIFIER_PRIVATE_KEY
pnpm --filter @toban/discord-bot exec wrangler secret put INSTALL_STATE_SECRET
```

Set `TURNKEY_ORGANIZATION_ID` and `TURNKEY_BOT_SIGNER_ADDRESS` either
in `wrangler.toml` (public) or as secrets (treated as private —
recommended for prod to slow down attacker reconnaissance).

For prod, repeat against a separate Cloudflare environment with
`--env prod`.

## 6. Verify

1. `pnpm --filter @toban/discord-bot deploy:dry` — confirms bundling.
2. `pnpm --filter @toban/discord-bot deploy --env dev` — deploys.
3. Send a Discord `/balance` interaction. The handler should resolve
   identity + read on-chain without touching Turnkey, so this confirms
   the Workers config independently of Turnkey.
4. Send a `/thx` interaction with a tiny amount. This exercises the
   full Turnkey -> sign -> broadcast path.

## Verifier key (separate concern)

`VERIFIER_PRIVATE_KEY` is the ES256 key used to sign verifier_tokens.
The matching public key is stored in the identity Worker as
`DISCORD_BOT_VERIFIER_PUBLIC_KEY`. This key is **not** in Turnkey
today — it's a Workers Secret. Its blast radius if leaked is "an
attacker can impersonate a Discord-to-wallet linking attempt" which is
bounded by the EIP-712 wallet signature in the identity flow. A future
issue may move this into Turnkey too; see `key-rotation.md`.
