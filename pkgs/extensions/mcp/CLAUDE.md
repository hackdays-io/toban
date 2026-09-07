# `@toban/mcp` (`pkgs/extensions/mcp`)

Cloudflare Workers + D1. The Toban MCP server (`POST /mcp`) — read-only
workspace tools, plus write "propose" tools that forward to
`@toban/discord-bot`'s confirm-button adapter. Extracted from
`@toban/discord-bot` so that **Discord is an adapter, not a requirement**:
this package holds no Discord bot token, and any MCP-speaking client (our
own OpenClaw, a community's OpenClaw, Claude Code, anything) can drive Toban
through it. See `docs/mcp-extraction.md` for the full design rationale —
this file is the "moved here" summary the design doc pointed at.

## Important invariants

- **No Ethereum private key or Turnkey stamper credential lives in this
  Worker, and never will.** Signing is exclusively `@toban/discord-bot`'s
  job. This package cannot mint THX or submit a quest completion even if
  every check inside it were bypassed — there is no code path here that
  reaches Turnkey.
- **A write tool never signs. It always produces a confirm button, by
  asking discord-bot to make one.** `toban_thx_propose` /
  `toban_quest_submit_propose` build an `InternalProposeRequest` (a type
  `import type`-ed from `@toban/discord-bot/internal-propose` — never
  implementation-imported) and call `env.CONFIRM.fetch(...)`. Nothing here
  builds a `ConfirmPayload` or talks to Discord's REST API; that stays in
  discord-bot on purpose (`docs/mcp-extraction.md` §3 — the package split
  that keeps `ConfirmPayload`'s producer and consumer in one place).
- **The acting user is never decided here.** A propose tool's
  `forDiscordUserId` argument is only "who may press the button" — a
  candidate, not an authorization. The actual actor is read from a
  Discord-signed component interaction inside `@toban/discord-bot`
  (`src/mcp/button.ts`), several hops away from anything this package
  controls.
- **A `tbn2` token's `treeId` is a read *default*, not a read *wall* — but
  it is a write *wall*, always.** Reads may pass an explicit `treeId`
  argument to look at another workspace (the underlying subgraph/chain data
  is public anyway — hiding it would be theatre). Propose tools take no
  `treeId` argument at all; they always target the token's home workspace.
  See §6 of the design doc for why this line is drawn where it is.
- **Identity resolution (`discordUserId <-> wallet`) only ever runs for the
  token's home `treeId`.** Unlike subgraph data, `@toban/identity`'s tables
  are not public — resolving them cross-workspace would let a token from
  community A build a Discord-ID↔wallet directory for community B. Every
  call site that could resolve identity (forward or reverse) is gated on
  `treeId === home` in `tools.ts`; grep for `CROSS_WORKSPACE_IDENTITY_NOTE`
  before adding a new one.
- **`tbn2` tokens verify in two stages, and the order matters.** Stage 1
  (`auth.ts`) is a stateless HMAC check — no D1 read — so a flood of
  garbage bearer tokens costs nothing but CPU. Only a token that survives
  stage 1 triggers stage 2, a `mcp_tokens` lookup that can find the token
  revoked. Do not reorder this, and do not skip stage 1 "to simplify" —
  it is what stops this endpoint from being a D1-read amplifier.
- **This package owns exactly one table's worth of data: the `tbn2`
  registry (`mcp_tokens`, `used_mcp_auth_nonces`).** It lives in the same
  physical D1 as `@toban/identity`'s tables (see `wrangler.toml`), but this
  package never reads or writes an identity table directly — identity
  resolution goes through the `IDENTITY` service binding
  (`src/identity.ts`), the same HTTP-boundary rule discord-bot follows.
- **`POST /internal/propose` is reached over the `CONFIRM` service binding,
  plus a shared secret** (`MCP_INTERNAL_PROPOSE_SECRET`, header
  `x-toban-mcp-propose-secret`). The binding alone does not close off
  discord-bot's public URL to a plain HTTPS POST from anyone — the secret
  is what actually does that. This secret is not in `docs/mcp-extraction.md`'s
  migration table; it was added during implementation because without it, a
  stranger could post arbitrary confirm buttons to any linked Discord
  channel without ever holding a valid MCP token.
- **Token issuance authorization is checked by this Worker, never trusted
  from the frontend.** `POST /api/mcp-tokens` verifies the EIP-712 signature
  itself and checks the Hats subgraph itself for "does this wallet wear the
  workspace's operator or top hat" — the frontend's hat display is UI only,
  not a security boundary.
- **Listing and revocation each sign a distinct EIP-712 primary type —
  `McpTokenListRequest` and `McpTokenRevokeRequest` — and never share one.**
  They used to be one `McpTokenManageRequest { wallet, treeId, expires,
  nonce}` shape, and that was a real, fixed vulnerability: listing's
  signature never burns its nonce (see below), and `tokenId` used to travel
  as a bare, unsigned request-body field, so any signature an admin produced
  to list their tokens could be replayed against `/revoke` with an
  attacker-chosen `tokenId`. `eip712/mcp-token.ts`'s module doc has the full
  writeup — do not reunify these two types. `handlers/list.ts`'s
  `parseWalletTreeAuthRequest` / `verifyWalletTreeAuth` are parameterised by
  the caller's expected `primaryType` and reject any envelope that doesn't
  match it; that check is what makes the two operations' signatures mutually
  unusable for each other.
- **Listing does not burn its EIP-712 nonce; revocation does.** This is
  intentional and, since the primaryType split above, safe: replaying a
  `McpTokenListRequest` signature within its `expires` window only lets the
  frontend reuse one signature for a settings-page session, and that
  signature is not a valid `McpTokenRevokeRequest` signature no matter how
  it's replayed. Revocation burns its nonce because it is a write, same as
  issuance.
- **A revoke request's `tokenId` comes from the verified, signed message,
  never from an unsigned body field.** `handlers/revoke.ts` reads
  `parsed.typedData.message.tokenId` — reintroducing a bare `tokenId` field
  anywhere in that handler reopens the vulnerability above. The
  `getToken`/`treeId`-match check in `revoke.ts` still runs after that: the
  signature proves the wallet may act for the tree, the lookup proves the
  named token belongs to it.
- **Issuance burns its EIP-712 nonce *after* signature verification but
  *before* the subgraph read, the hat check, and `insertToken`. Both
  boundaries are load-bearing; do not move it to either side.** After the
  signature, because this is the handler's first write and the endpoint is
  public (the browser posts to it directly) — burning any earlier lets an
  unauthenticated stranger insert a row per request into
  `used_mcp_auth_nonces` with nonces of their own choosing, which is
  unbounded growth on a table with no pruning path. Before `insertToken`,
  because the PRIMARY KEY on `used_mcp_auth_nonces.nonce` is only real
  mutual exclusion for concurrent replays of one captured, validly-signed
  `McpTokenIssueRequest` if it is claimed before the token exists; burning
  after the insert left a window where N concurrent replays all passed a
  plain `isAuthNonceUsed` read and each minted its own token, with only the
  losers 500ing later on the PK. A request that burns its nonce and then
  fails the hat check or finds the workspace unindexed leaves that nonce
  permanently spent — fine, not a trap, because the only real caller signs
  a fresh `{expires, nonce}` on every attempt, so a retry after failure is
  never a replay of the failed request. Two tests pin this pair:
  "burns the nonce even when a later check (hat ownership) rejects the
  request" and "does NOT burn the nonce when the signature is invalid". See
  `handlers/issue.ts`'s comment at the `markAuthNonceUsed` call for the
  full reasoning, including why this is the *opposite* order from
  `@toban/identity`'s `connect.ts` (which persists before burning, for a
  different failure-mode trade-off — read that file's comment too before
  "fixing" one to match the other).
- **`lookupDiscordIds` (`tools.ts`) chunks its reverse-lookup batches at
  `IDENTITY_LOOKUP_CHUNK_SIZE` (200), mirroring identity's own
  `MAX_WALLETS_PER_BATCH`.** `toban_workspace_members` alone can pass up to
  300 addresses at `MAX_LIMIT`; a single oversized call gets a 400 from
  identity, which used to collapse into an empty map for every wallet in
  the call — every `*DiscordUserId` came back `null`, indistinguishable
  from "nobody linked a wallet". A chunk that still fails after chunking
  sets `identityLookupDegraded: true` on the tool's JSON response instead
  of letting its wallets' `null`s look like confirmed non-links.
- **`verifyMcpTokenAuthViaRpc` (`verify.ts`) never trusts the caller-supplied
  `typedData.types` / `typedData.domain` for the actual verification** —
  it rebuilds the domain via `buildMcpTokenDomain(chainId)` and picks the
  `MCP_TOKEN_*_TYPES` constant matching `primaryType`. A mismatched type or
  domain was never exploitable (either one changes the digest, so a
  captured signature already can't be replayed under a different shape),
  but pinning removes the need to re-derive that argument every time this
  function is touched.
- **`src/chain.ts` holds a view-only ThanksToken ABI fragment, duplicated
  from `@toban/discord-bot`'s `chain.ts` on purpose.** `turnkey/policy.json`
  (in discord-bot) only ever gates *state-changing* selectors, so a second
  Worker holding a read-only copy of `mintAllowance` / `mintableAmount`
  changes nothing about what can be signed. Never add a state-changing
  function to this file — see discord-bot's `CLAUDE.md` for the invariant
  this duplication respects (`chain.ts` there is the source of truth for
  **write** selectors only).

## Layout

```
src/
  worker.ts            Workers entry: CORS + routing to /mcp and /api/mcp-tokens*
  index.ts             POST /mcp — auth -> JSON-RPC -> tools
  env.ts               Env / bindings type
  auth.ts              tbn2 bearer tokens: stateless MAC + registry lookup
  protocol.ts          minimal MCP over JSON-RPC 2.0 (moved from discord-bot,
                       unchanged — it was already Discord-independent)
  tools.ts             tool definitions + read handlers + propose forwarders
  queries.ts           read-only Goldsky queries behind the read tools
  chain.ts             viem client + VIEW-ONLY ThanksToken ABI fragment
  identity.ts          read-only IdentityClient (getIdentity /
                       getIdentitiesByWallets only — no writes)
  schema.ts            Drizzle tables: mcp_tokens, used_mcp_auth_nonces
  registry.ts          Drizzle queries against this package's own tables
  verify.ts            EIP-712 signature verification (viem, RPC-based,
                       handles EOA / EIP-1271 / ERC-6492 uniformly)
  eip712/
    mcp-token.ts       TypedData boundary contract — no viem import, so the
                       frontend can import it via the `@toban/mcp/eip712`
                       subpath (mirrors `@toban/identity/eip712` exactly)
  handlers/
    issue.ts           POST /api/mcp-tokens        — issue a new token
    list.ts            POST /api/mcp-tokens/list   — list a workspace's tokens;
                       also owns `parseWalletTreeAuthRequest` /
                       `verifyWalletTreeAuth`, the primaryType-parameterised
                       auth shared with revoke.ts (see CLAUDE.md invariants)
    revoke.ts          POST /api/mcp-tokens/revoke — revoke one token, whose
                       tokenId comes from the signed McpTokenRevokeRequest
                       message, never a bare body field
migrations/
  0001_init.sql        D1-compatible SQL matching schema.ts byte-for-byte
scripts/
  mint-mcp-token.ts    operator escape hatch (writes the registry row too —
                       see the script's own doc comment for why)
test/                  Vitest unit tests (no network, no chain, no real D1)
```

## Commands

```
pnpm --filter @toban/mcp dev                # wrangler dev
pnpm --filter @toban/mcp test                # vitest run
pnpm --filter @toban/mcp typecheck           # tsc --noEmit
pnpm --filter @toban/mcp deploy:dry:sepolia  # dry-run (top-level config)
pnpm --filter @toban/mcp deploy:sepolia      # → toban-mcp       (top-level)
pnpm --filter @toban/mcp deploy:base         # → toban-mcp-base  (--env base)
pnpm mcp mint-mcp-token <treeId> <label> [--env base]   # operator escape hatch
```

**Deploying**: read `DEPLOYMENT.md` (repo root) first. Non-obvious constraints:

- **Deploy order: `identity` → `discord-bot` → `mcp` → `openclaw`.** This
  worker service-binds to *both* `toban-identity` (read-only identity
  resolution) and `toban-discord-bot` (the `CONFIRM` adapter) by name — a
  missing binding target fails the deploy with Cloudflare error 10143.
- **Sepolia is the wrangler top-level config** (worker `toban-mcp`); only
  Base is a named env. There is no `[env.sepolia]`.
- **Shares D1 with `@toban/identity` and `@toban/discord-bot`**
  (`toban-identity` / `toban-identity-base`), but owns only the `mcp_tokens`
  / `used_mcp_auth_nonces` tables in it. Run its own migration once per
  environment: `pnpm --filter @toban/mcp db:migrate:remote:<sepolia|base>`.
- `MCP_TOKEN_SECRET` moved here from `@toban/discord-bot` — do not leave a
  copy configured on the bot Worker; it no longer reads that secret.
- `MCP_INTERNAL_PROPOSE_SECRET` and `LOOKUP_READ_SECRET` **must equal** the
  corresponding values on `@toban/discord-bot` (and, for `LOOKUP_READ_SECRET`,
  `@toban/identity`) in the same environment.
- No bare `deploy` script: `pnpm --filter <pkg> deploy` hits pnpm's builtin
  and errors with `ERR_PNPM_INVALID_DEPLOY_TARGET`.

## When making changes

- Don't add a signing capability here, ever. If a feature seems to need one,
  it belongs in `@toban/discord-bot` behind a new `/internal/*` endpoint —
  see `docs/mcp-extraction.md` §3 for why the split is drawn this way.
- Adding an MCP tool → add it to `TOOL_DEFINITIONS` **and** `callTool` in
  `tools.ts`, and say plainly in its `description` whether it acts or only
  proposes, and whether it resolves Discord user ids (and therefore needs
  the cross-workspace-identity note). The description is the only thing a
  third-party agent reads.
- Adding a *read* tool argument that widens scope → give it a `treeId`
  argument defaulting to home (see `treeIdArg` in `tools.ts`), not a new
  ad-hoc parameter. Adding a *propose* tool → do **not** give it a `treeId`
  argument; propose stays home-only.
- Touching `InternalProposeRequest` / `InternalProposeResponse` → edit them
  in `@toban/discord-bot/src/internal/propose.ts` (this package only
  `import type`s them) and update both sides in the same change.
- Don't bypass the identity HTTP boundary by reaching into D1 directly, and
  don't add a write path to `@toban/identity`'s tables from here — this
  package is read-only with respect to identity.
- Adding a new `platform_links.metadata` namespace, or anything else that
  touches identity's schema → that change belongs in `@toban/identity`, not
  here, even though the D1 file is physically shared.
