# Key rotation runbook

There are three keys to rotate. Read this whole file before touching
anything in production.

| Key                            | Where it lives        | Blast radius if leaked                           |
|--------------------------------|-----------------------|--------------------------------------------------|
| Bot signing key (`mintFrom`)   | Turnkey TEE           | Up to each user's `mintAllowance` until revoked  |
| Turnkey API stamper key        | Workers Secret        | Same — but constrained by Turnkey policy         |
| `VERIFIER_PRIVATE_KEY` (ES256) | Workers Secret        | Identity-link impersonation (no on-chain mint)   |

## Triggers

Rotate immediately on any of:

- Any of the keys above is suspected leaked (developer machine compromise,
  exposed log, accidental commit, ...).
- A maintainer with access to either Turnkey sub-org or Workers Secrets
  leaves the team.
- Turnkey audit log shows unexpected request shapes (calls to functions
  other than `mintFrom`, signing-attempt spikes, policy-reject spikes).
- ThanksToken contract is upgraded and the `mintFrom` selector changes
  (in which case the bot can't sign anything anyway — rotate the
  policy together with the contract upgrade).

Rotate on schedule otherwise:

- Bot signing key: every 6 months.
- Stamper key: every 6 months, ideally offset 3 months from signer key.
- Verifier key: every 12 months, or together with stamper.

## Scheduled bot-signing-key rotation

1. Generate a new Turnkey signing key inside the same sub-organization
   (`docs/turnkey-setup.md` step 2). Note the new address `0xNEW`.
2. Open a PR that adds `0xNEW` to `turnkey/policy.json` (under the
   relevant rule's allow-list). Merge after review.
3. Apply the updated policy to Turnkey (`turnkey policy update ...`).
   At this point both `0xOLD` and `0xNEW` can sign.
4. `wrangler secret put TURNKEY_BOT_SIGNER_ADDRESS` (or update
   `wrangler.toml` if public) to `0xNEW` and `wrangler deploy`.
5. Use the frontend `/allowance/discord-bot` page to surface, to each
   user who has a non-zero allowance on `0xOLD`, a one-click migration
   that calls `approveMint(0xNEW, value)` (and optionally
   `approveMint(0xOLD, 0)` to revoke).
6. From the bot, announce the rotation in each linked guild (`platform_links`).
7. **Day +7**: in Turnkey, mark `0xOLD` *inactive* (new signatures
   refused). The Worker should already be using `0xNEW`; this is the
   "no surprises" cutover.
8. **Day +14**: mark `0xOLD` *disabled* and remove from policy.
9. Append an entry to `docs/ops/rotation-log.md` (create the file if
   missing):
   ```md
   - 2026-MM-DD scheduled: 0xOLD -> 0xNEW by @maintainer.
     Migration rate at cutover: NN%.
   ```

## Emergency bot-signing-key rotation

Compress the schedule above into hours, not weeks. Order matters:

1. **Disable the compromised key first.** In Turnkey, mark `0xOLD`
   *disabled* immediately. All `mintFrom` signing attempts now fail at
   Turnkey; users keep their funds.
2. Generate `0xNEW`, update policy (PR + apply), update
   `TURNKEY_BOT_SIGNER_ADDRESS`, `wrangler deploy`. Target: < 1 hour.
3. Push a `frontend` banner + Discord DM to every linked guild and to
   every identity-bound user, with:
   - "The bot signing key was rotated. `/thx` is offline for ~1h."
   - "Strongly recommended: visit `/allowance/discord-bot` to revoke
     the old signer (`approveMint(0xOLD, 0)`)."
4. Pull subgraph history for `MintFrom(spender == 0xOLD)` since the
   suspected compromise window. Cross-reference with Discord
   `discord_bot_thx_log` (if enabled) to identify any unauthorized
   transfers.
5. Open `docs/incidents/<YYYY-MM-DD>.md` and fill: timeline, root
   cause, blast radius, follow-ups.

## Stamper-key rotation (Workers Secrets)

Stamper keys are policy-constrained, so this is lower-risk than signer
rotation — but the procedure is the same shape, minus on-chain
allowance migration:

1. Generate a new stamper key pair (turnkey-setup.md step 3).
2. In Turnkey console, upload the new public key as a new API user
   *in addition to* the current one.
3. `wrangler secret put TURNKEY_API_PUBLIC_KEY` and
   `TURNKEY_API_PRIVATE_KEY` to the new values. `wrangler deploy`.
4. Smoke-test `/balance` and `/thx` (one small transaction) — these
   exercise the stamper path.
5. In Turnkey, revoke the old stamper API user.

For emergencies, swap the order: revoke first, then re-issue and
re-deploy. The bot is offline for the gap.

## Verifier-key rotation

1. Generate a new ES256 key pair.
2. Update the identity Worker's `DISCORD_BOT_VERIFIER_PUBLIC_KEY` to
   accept both old and new (it should support a JSON array of keys; if
   not, file an issue on `extensions/identity` and patch it first).
3. `wrangler secret put VERIFIER_PRIVATE_KEY` to the new private key.
   `wrangler deploy`.
4. After 30 minutes (longer than `VERIFIER_TOKEN_TTL_SECONDS` plus
   margin), remove the old public key from the identity Worker.
5. Open-tokens from before step 3 will be rejected by identity after
   step 4 — this is acceptable since their TTL was 15 minutes.

## What we punt on (today)

- Automated Turnkey audit-log pull. The runbook above assumes humans
  notice anomalies; a Worker cron that diffs Turnkey activity against
  expected `mintFrom` shape and posts to Discord is a follow-up issue.
- Multi-signer signing key. Turnkey supports threshold signing; the
  bot uses a single key for MVP. Worth revisiting once volume grows.
- Recovery if the entire Turnkey sub-org is compromised. The
  realistic answer is "redeploy under a new sub-org, ask users to
  re-approve allowance to the new address." We do not have an
  automated migration for this scenario.
