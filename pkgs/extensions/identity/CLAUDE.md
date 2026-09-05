# CLAUDE.md — pkgs/extensions/identity

`@toban/identity` — provider-abstracted Web2 account ↔ wallet binding library for Toban extensions. The repo-root `CLAUDE.md` covers monorepo-wide concerns.

## Responsibility

This package owns **only the binding declaration** ("this Web2 `(provider, account_id)` belongs to this wallet"). It does not own:

- on-chain delegation / mint allowance (that lives in the contract layer — `ThanksToken.approveMint` / `mintAllowance`; there is no separate allowance module)
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

Cloudflare Workers (no Node-only APIs), and this package **is a deployed Worker of its own** — `src/worker.ts` is the `main` in `wrangler.toml`, and it owns the routing. (It started as a library of mountable handlers; `handlers/*` still export pure `Request → Promise<Response>` functions, and `src/index.ts` re-exports them, but the deployed entry point is `worker.ts`.) Persistence is the `DB` D1 binding.

Routes served by `worker.ts`: `POST /api/connect`, `GET /api/lookup`, `GET`/`POST /api/platform-link`, `POST /api/platform-link/notify-channel`, `POST /api/install-state/claim-jti`, `GET /health`.

## Stack

- **viem** — `publicClient.verifyTypedData` (EOA + EIP-1271 + ERC-6492), `recoverTypedDataAddress`, `keccak256`, `toBytes`. Worker-safe.
- **jose** — ES256 (P-256 ECDSA) JWT verify via `importSPKI` + `jwtVerify`. Worker-safe.
- **drizzle-orm/d1** — typed queries against D1. Schema lives in `src/schema.ts`; migrations in `migrations/`.
- **vitest** — unit tests run against in-memory `better-sqlite3` using `drizzle-orm/better-sqlite3` (the dialect matches D1, so test queries are representative).

## Layout

```
src/
  worker.ts                     # Workers entry: CORS + routing to the handlers below
  eip712/
    identity-binding.ts         # TypedData types + domain builder
    hash-verifier-token.ts      # verifierTokenHash helper
  providers/
    types.ts                    # ProviderDefinition / Env contract
    discord.ts                  # ES256 JWT verify against DISCORD_BOT_VERIFIER_PUBLIC_KEY
    index.ts                    # registry: { discord: discordProvider }
  handlers/
    connect.ts                  # POST /api/connect — full verification flow
    lookup.ts                   # GET  /api/lookup?provider=&account_id=
    platform-link.ts            # POST /api/platform-link — guild -> treeId
    install-state.ts            # POST /api/install-state/claim-jti — single-use OAuth state
  platform-link-metadata.ts     # `platform_links.metadata` の共有スキーマ + マージ
  queries.ts                    # drizzle DB ops (getIdentity, upsertIdentity, ...)
  schema.ts                     # Drizzle tables: identities, platformLinks, usedBindingNonces, usedInstallStateJtis
  verify.ts                     # verifyIdentityBindingViaRpc + recoverIdentityBindingSigner + verifyJwtES256
  index.ts                      # named re-exports
migrations/
  0001_init.sql                  # D1-compatible SQL matching schema.ts byte-for-byte
scripts/
  dev-token.ts                   # mints a dev verifier_token for local testing
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
5. `verifyIdentityBindingViaRpc(typedData, signature, wallet, RPC_URL)` returns true. This goes through viem's `publicClient.verifyTypedData`, so it accepts **EOA signatures, deployed smart wallets (EIP-1271 `isValidSignature`), and undeployed ones (ERC-6492)** uniformly — Privy smart wallets need this. It requires `RPC_URL` on the chain named in `typedData.domain.chainId`. (`recoverIdentityBindingSigner` still exists for EOA-only recovery, but `/api/connect` does not use it.)
6. `typedData.message.expires > now`.
7. `typedData.message.nonce` is not already in `used_binding_nonces`.

The success path performs an atomic-feeling pair of writes (D1 transactions are not yet GA — we order them so that nonce insertion fails on conflict before identity upsert is observed by readers).

## `platform_links.metadata` のスキーマ（boundary contract — 勝手に形を変えないこと）

`platform_links.metadata` は provider 固有 JSON を入れる `TEXT` カラムで、**1 つの機能の
持ち物ではない**。#575（通知チャンネル）に続いて #577（MCP トークンの guild 単位失効）も
同じカラムを使うため、形をここで固定する。実装とその理由は
`src/platform-link-metadata.ts` の冒頭コメントにある。

```jsonc
{
  "v": 1,                         // スキーマバージョン（オブジェクト全体に 1 つ）
  "notify": { "channelId": "…" }, // #575 が所有。Discord snowflake
  "mcp":    { "tokenVersion": 1 } // #577 が所有（予定）
}
```

決めたこと:

- **トップレベルは機能ごとの名前空間オブジェクト**にする。フラットな `notifyChannelId` に
  しないのは、機能が増えたときのキー衝突を人間の注意力で避ける形にしたくないから。
  名前空間なら「部分更新の単位 = サブツリー = 所有者」が一致する。
- **`v` はオブジェクト全体に 1 つだけ**。名前空間ごとに持たせると読み出し側が N 個の分岐を
  抱える。後方互換な追加では上げず、**非互換な作り替えのときだけ**上げる。読み出し側は
  未知の `v` でも既知のキーだけを見て動くこと。
- **書き込みは必ず read-modify-write**。`mergePlatformLinkMetadata()` を通し、知らないキーは
  素通しで保存する。素朴に上書きすると他機能の値が消える（テストで固定済み:
  `src/__tests__/platform-link.test.ts`）。`updatePlatformLinkMetadata()` は受け取った文字列を
  そのまま書くだけなので、**単体で呼ばないこと**。
- **専用テーブルには切り出さない**（今は）。`(provider, platform_id)` に対する 1 行の属性
  でしかなく、JOIN が要る形にする理由がない。「一覧・検索したくなる」規模になったら切り出す。
- 値が空になった名前空間は落とし、`v` しか残らなければカラムを `NULL` に戻す
  （未設定 == `NULL` を保つ）。

新しい名前空間を足すときは:

1. 名前空間名と型を `src/platform-link-metadata.ts` に足す。
2. **専用の書き込みルートを 1 本足す**（`handlePlatformLinkNotifyChannel` を真似る）。
   汎用の metadata PATCH エンドポイントは**用意しない** — 何でも入る書き込み口を開けると、
   値のバリデーションに責任を持つ場所が無くなる。
3. 既存キーの意味を変えるなら `v` を上げ、読み出し側に移行を書く。

D1 にトランザクションが無いので read-modify-write は原子的ではない。今の書き込み頻度
（人がボタンを押す）では後勝ちで実害が無いため素の実装にしている。秒間で競合する書き込みを
足すときはこの前提を見直すこと。

## Adding a new provider

1. Create `src/providers/<name>.ts` exporting a `ProviderDefinition` with `verifyVerifierToken`.
2. Register it in `src/providers/index.ts`.
3. Add tests for the verifier (valid + expired + tampered).
4. Document the issuer's JWT shape in this file's boundary section.

**Do not** add provider-specific branches inside `handlers/connect.ts`. That handler is provider-agnostic by design.

## Test approach

Tests live under `src/__tests__/`. They sign real ES256 JWTs and EIP-712 payloads via `jose` and `viem` so the same code paths run as in production; no mocking of cryptographic primitives. The DB layer is exercised against an in-memory SQLite (matching D1's dialect) — `queries.ts` is agnostic to the underlying `BetterSQLite3Database` vs `DrizzleD1Database` choice because both implement the same `SQLiteSyncDialect` / `SQLiteAsyncDialect` query surface.

## Deploying

Read `DEPLOYMENT.md` (repo root) — the full, order-dependent runbook.

```
pnpm --filter @toban/identity deploy:sepolia          # → toban-identity       (wrangler top-level)
pnpm --filter @toban/identity deploy:base             # → toban-identity-base  (--env base)
pnpm --filter @toban/identity db:migrate:remote:base  # first deploy to an env only
```

- **Deploy this worker BEFORE `@toban/discord-bot`.** The bot service-binds to it *by name*;
  deploying the bot against a missing identity worker fails with Cloudflare error 10143.
- **Sepolia is the wrangler top-level config** (worker `toban-identity`); only Base is a named env.
  There is no `[env.sepolia]`.
- **Both envs live in the same Cloudflare account**, separated by worker name (`toban-identity` /
  `toban-identity-base`) and by D1 — not by account. The D1s are separate because `platform_links`
  maps guild → treeId, and a treeId only exists on one chain.
- No bare `deploy` script: `pnpm --filter <pkg> deploy` hits pnpm's builtin and errors with
  `ERR_PNPM_INVALID_DEPLOY_TARGET`.
- `LOOKUP_READ_SECRET` / `PLATFORM_LINK_WRITE_SECRET` **must be identical** to the discord-bot
  worker's values in the same env, or every lookup returns 401.
