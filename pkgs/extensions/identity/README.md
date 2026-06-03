# `@toban/identity`

Toban における **「この Web2 アカウントはこの wallet に属する」** という off-chain な紐づけを管理する Cloudflare Worker です。4 つの HTTP エンドポイントを公開し、状態は Cloudflare D1 に保存します。provider 抽象化されているので、Slack / GitHub などの追加連携を connect フロー本体に触れずに増やせる構造になっています。

この Worker が一次情報になるのは 2 種類のレコードです:

1. **Identity** — `(provider, account_id) → wallet`。ユーザーが自分の wallet で EIP-712 の `IdentityBinding` に署名した時点で登録されます。
2. **Platform link** — `(provider, platform_id) → tree_id`。workspace 管理者が対応する extension をインストールしたときに登録されます (例: Discord bot を招待して `/toban-link` を打つ)。

MVP では `discord` provider のみが同梱されています。対になる extension は [`@toban/discord-bot`](../discord-bot/README.md) で、今のところ書き込み系エンドポイントの唯一のクライアントであり、Cloudflare の service binding 経由でこの Worker を叩きます。この README だけ読んでも Worker を動かすには十分ですが、「誰がそれを呼び出しているのか」を補足する形で随所に bot 側 README へのリンクを置いています。

## TL;DR

```
admin (Discord)  /toban-link  →  POST  /api/platform-link
member           /toban-setup →  DM URL → frontend signs → POST /api/connect
                                                      → identities row
member (Discord) /thx         →  GET   /api/lookup ×2  (sender + recipient)
                              →  GET   /api/platform-link  (resolve workspace)
```

状態変更はすべて以下のフローに対応します。lookup 系は純粋な読み取りです。

## プロジェクトオーナー視点での全体フロー

[discord-bot README](../discord-bot/README.md#プロジェクトオーナー視点での全体フロー) と同じシーケンスを、この Worker から見た姿で記述したものです。どちらの README も単体で読めるようにしてあります。

### 1. bot が Discord サーバーに招待される

この時点では Worker は何もしません。bot は guild に参加し、Discord 側 interactions エンドポイントへの POST を待ち受けるだけです。

### 2. Identity binding — `/toban-setup` → `/connect/discord` → `POST /api/connect`

discord-bot が呼び出し元の Discord snowflake 向けに ES256 verifier_token (JWT) を発行し、`https://toban.xyz/connect/discord?token=<jwt>&treeId=<tree>` の URL を DM で渡します。frontend が wallet login と EIP-712 署名を担当します。

その後 frontend がこの Worker へ POST してきます:

```http
POST /api/connect
Content-Type: application/json

{
  "provider": "discord",
  "verifier_token": "<ES256 JWT>",
  "identity_binding": {
    "typedData": {
      "domain":      { "name": "TobanIdentity", "version": "1", "chainId": <number> },
      "types":       { "IdentityBinding": [ /* see below */ ] },
      "primaryType": "IdentityBinding",
      "message":     {
        "wallet":            "<address>",
        "provider":          "discord",
        "accountId":         "<discord snowflake>",
        "verifierTokenHash": "<bytes32>",
        "expires":           <unix seconds>,
        "nonce":             "<bytes32>"
      }
    },
    "signature": "0x…"
  }
}
```

`src/handlers/connect.ts` のハンドラは「軽いチェック → 重いチェック」の順で短絡評価し、最初に落ちた段階で安定した `{ error: <code> }` JSON (HTTP 400) を返します。エラーコードは `ConnectErrorCode` 型に列挙されていて、frontend 側はコードごとに分岐済みです。

検証の不変条件 — すべて満たさないと失敗します:

1. JWT が `DISCORD_BOT_VERIFIER_PUBLIC_KEY` (ES256, P-256 SPKI PEM) で検証できて `exp` が未来。
2. `typedData.message.provider === provider` (request-level)。
3. `typedData.message.accountId === claims.accountId` (JWT 由来)。
4. `typedData.message.verifierTokenHash === keccak256(utf8Bytes(verifier_token))`。
5. `typedData.message.wallet` 名義の EIP-712 署名として正当。viem の `publicClient.verifyTypedData(env.RPC_URL)` を呼ぶので、EOA recover / EIP-1271 smart account (Privy embedded smart wallet がここ) / ERC-6492 counterfactual の 3 つを統一処理します。
6. `typedData.message.expires > now`。
7. `typedData.message.nonce` が `used_binding_nonces` に未登録。

成功時は `(provider, account_id) → wallet` を `identities` に upsert し、nonce を `used_binding_nonces` に書き込みます。同じ Web2 アカウントを別 wallet に再 bind することは許可していて、`wallet` と `updated_at` が上書きされます。`created_at` は保存されたまま。

EIP-712 の型定義 (discord-bot + frontend `/connect/discord` 側と同期):

```ts
domain: {
  name: "TobanIdentity",
  version: "1",
  chainId: <signer's network chainId>,
  // verifyingContract なし — off-chain 用途
}
types: {
  IdentityBinding: [
    { name: "wallet",            type: "address" },
    { name: "provider",          type: "string"  },
    { name: "accountId",         type: "string"  },
    { name: "verifierTokenHash", type: "bytes32" },
    { name: "expires",           type: "uint256" },
    { name: "nonce",             type: "bytes32" },
  ],
}
```

bot がどう JWT を発行し、frontend がどう typedData を組むかは [discord-bot README: identity binding](../discord-bot/README.md#3-各メンバーが-discord-アカウントと-wallet-を結びつける) を参照してください。

### 3. サーバーと workspace の紐づけ — `/toban-link` → `POST /api/platform-link`

wallet を紐づけた管理者が Discord 上で `/toban-link <workspace-url>` を打ちます。bot は service binding 経由でこの Worker を叩きます:

```http
POST /api/platform-link
Content-Type: application/json

{
  "provider":    "discord",
  "platformId":  "<guild_id>",        // platform_id も受け付ける
  "treeId":      "<workspace tree id, decimal string>",
  "installedBy": "<installer の address>",
  "metadata":    { ... }              // optional, JSON object か string
}
```

ハンドラは `platform_links` に upsert します。`(provider, platform_id)` 競合時は `tree_id` / `installed_by` / `metadata` を更新します。これは bot を再 install せずに workspace を別 tree に乗せ換えたい場合にも便利です。

### 4. THX 送付フロー — `/thx` → `/api/lookup` × 2 + `/api/platform-link`

`/thx amount user:@bob` が発火すると、bot はこの Worker に対して 3 つの読み取りを行います:

```http
GET /api/lookup?provider=discord&account_id=<sender snowflake>
GET /api/lookup?provider=discord&account_id=<recipient snowflake>
GET /api/platform-link?provider=discord&platform_id=<guild_id>
```

`/api/lookup` は 200 で `{ "wallet": "0x…", "metadata"?: object }`、未登録なら 404 で `{ "error": "not_found" }`。
`/api/platform-link` は 200 で `{ provider, platformId, treeId, installedBy, metadata? }`、未登録なら 404。

受け取り側を `address:` (生 `0x…` か ENS) で指定した場合、bot は recipient lookup をスキップします — 詳細は [discord-bot README: メンバーが THX を送る](../discord-bot/README.md#5-メンバーが-thx-を送る) 参照。

`/thx` 時のこの Worker は完全に読み取り専用で、on-chain 操作は全部 bot 側で行います。

## HTTP API 一覧

| Path | Method | Body / Query | Response | 実装 |
|---|---|---|---|---|
| `/api/connect` | POST | `{ provider, verifier_token, identity_binding }` | 200 `{ ok: true }` / 400 `{ error, details? }` | `handlers/connect.ts` |
| `/api/lookup` | GET | `?provider&account_id` (もしくは `accountId`) | 200 `{ wallet, metadata? }` / 404 `{ error: "not_found" }` | `handlers/lookup.ts` |
| `/api/platform-link` | GET | `?provider&platform_id` (もしくは `platformId`) | 200 `{ provider, platformId, treeId, installedBy, metadata? }` / 404 | `handlers/platform-link.ts` |
| `/api/platform-link` | POST | `{ provider, platformId, treeId, installedBy, metadata? }` | 200 `{ ok: true }` | `handlers/platform-link.ts` |
| `/health` | GET | — | 200 `{ ok: true }` | `worker.ts` |

CORS は `/api/*` で全 origin 許可。認証は同一オリジンポリシーではなく、リクエスト本文に含まれる暗号証明 (JWT + EIP-712) で行います。

## D1 スキーマ

```sql
-- (provider, account_id) → wallet
CREATE TABLE identities (
  provider     TEXT NOT NULL,
  account_id   TEXT NOT NULL,
  wallet       TEXT NOT NULL,           -- checksum address (mixed case 保持)
  metadata     TEXT,                    -- JSON 文字列、provider 固有
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (provider, account_id)
);
CREATE INDEX idx_identities_wallet ON identities(wallet);

-- (provider, platform_id) → tree_id
CREATE TABLE platform_links (
  provider     TEXT NOT NULL,
  platform_id  TEXT NOT NULL,
  tree_id      TEXT NOT NULL,
  installed_by TEXT NOT NULL,
  metadata     TEXT,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (provider, platform_id)
);
CREATE INDEX idx_platform_links_tree ON platform_links(tree_id);

-- IdentityBinding 署名の replay 対策
CREATE TABLE used_binding_nonces (
  nonce        BLOB PRIMARY KEY,
  used_at      INTEGER NOT NULL
);
```

`pnpm --filter @toban/identity db:migrate:local` (Miniflare のローカル D1) または `db:migrate:remote` (deploy 済み D1) で適用します。

## 構成

```
src/
  worker.ts                       fetch entry — /api/* と /health のルーティング
  schema.ts                       identities / platform_links / used_binding_nonces
                                  の Drizzle 定義
  queries.ts                      Drizzle helpers (getIdentity, upsert*, etc.)
  eip712/identity-binding.ts      typed-data 定義 + verifierTokenHash
  verify.ts                       recoverIdentityBindingSigner +
                                  verifyIdentityBindingViaRpc +
                                  verifyJwtES256
  providers/
    types.ts                      ProviderDefinition / IdentityEnv 契約
    discord.ts                    DISCORD_BOT_VERIFIER_PUBLIC_KEY に対する
                                  ES256 JWT 検証
    index.ts                      registry: { discord: discordProvider }
  handlers/
    connect.ts                    POST /api/connect — フル検証フロー
    lookup.ts                     GET  /api/lookup
    platform-link.ts              GET/POST /api/platform-link
  __tests__/                      vitest (実 JWT + EIP-712 fixture)
migrations/
  0001_init.sql                   D1 互換 SQL、schema.ts と完全一致
scripts/
  dev-token.ts                    開発用ヘルパ。P-256 verifier keypair を
                                  生成 (.dev-keys/ 配下) し、ローカルテスト用
                                  に署名済み verifier_token を発行
```

## Stack

- **Cloudflare Workers** ランタイム (Node 専用 API は禁止)。許可された依存ライブラリの一覧はこのディレクトリの CLAUDE.md にあります。
- **viem** — `recoverTypedDataAddress`, `publicClient.verifyTypedData`, `keccak256`。Worker 互換。
- **jose** — ES256 JWT 検証 (`importSPKI` + `jwtVerify`)。Worker 互換。
- **drizzle-orm/d1** — D1 への型付きクエリ。同じ `queries.ts` がテストでは in-memory `better-sqlite3` でも動きます。
- **vitest** — テストでは本物の ES256 JWT と EIP-712 を署名するので、本番コードパスがそのまま回ります。

## コマンド

```
pnpm --filter @toban/identity dev              # wrangler dev (Miniflare)
pnpm --filter @toban/identity test             # vitest run
pnpm --filter @toban/identity typecheck        # tsc --noEmit
pnpm --filter @toban/identity deploy           # wrangler deploy
pnpm --filter @toban/identity deploy:dry       # wrangler deploy --dry-run
pnpm --filter @toban/identity db:migrate:local
pnpm --filter @toban/identity db:migrate:remote
pnpm --filter @toban/identity dev-token --snowflake <id> --tree-id <tree>
```

## デプロイ手順

identity Worker は 2 つの外部サービスに依存します — Cloudflare アカウント (Workers + D1) と Ethereum RPC プロバイダ (EIP-1271/6492 署名検証用)。3 つ目の依存先である discord-bot 側の verifier 公開鍵は **discord-bot のデプロイ手順で生成** したものを使い回します — Step 4 と [discord-bot README: デプロイ手順](../discord-bot/README.md#デプロイ手順) を参照してください。

### Step 1 — Cloudflare の前準備

1. **アカウント作成** — https://dash.cloudflare.com で。staging 用なら free tier で十分です。
2. **wrangler でログイン**:
   ```bash
   pnpm --filter @toban/identity exec wrangler login
   ```
   ブラウザが開き、OAuth で `workers:write` / `d1:write` 等の権限を付与します。
3. **デプロイ先アカウントを確認**:
   ```bash
   pnpm --filter @toban/identity exec wrangler whoami
   ```

### Step 2 — D1 データベースを作る

```bash
pnpm --filter @toban/identity exec wrangler d1 create toban-identity
```

`database_id` (UUID) が出力されるので、`wrangler.toml` の `[[d1_databases]]` ブロックに貼ります。`binding = "DB"` と `database_name = "toban-identity"` の行はそのままで OK。

スキーマを適用:

```bash
pnpm --filter @toban/identity db:migrate:remote
```

(動作確認: `wrangler d1 execute toban-identity --remote --command="SELECT name FROM sqlite_master WHERE type='table'"` で `identities` / `platform_links` / `used_binding_nonces` の 3 つが見えれば成功)

### Step 3 — Ethereum RPC URL を取得

connect ハンドラが `publicClient.verifyTypedData` を `RPC_URL` 経由で呼び、Privy smart wallet などからの EIP-1271/6492 署名を検証します。問い合わせる chain は frontend が typed-data に書く chainId と同じものを指す必要があります (staging なら Sepolia、production なら Base)。

選択肢:

- **Alchemy** (推奨) — https://www.alchemy.com で無料アカウント → "Create new app" → 対象 network 選択 → HTTPS URL をコピー (`https://eth-sepolia.g.alchemy.com/v2/<key>` のような形)。
- **Infura** — https://www.infura.io でほぼ同じ手順。
- **公開 RPC** (`cloudflare-eth.com`, `ankr.com` 等) — 基本コール用途では動くけれど、smart wallet 系の ENSIP-10 / CCIP-Read 経路は不安定。Alchemy / Infura に揃えるのが安全です。

frontend が同 chain の Alchemy key を既に使っているなら、それを使い回せます。

### Step 4 — verifier keypair を生成 (bot と対称)

identity Worker は verifier_token JWT を `DISCORD_BOT_VERIFIER_PUBLIC_KEY` で検証します。秘密鍵側は bot Worker の `VERIFIER_PRIVATE_KEY` として配置されます。**両者を同時に生成**して必ずペアになるようにしてください。

ローカルでは付属のヘルパーが楽です (Sepolia 用の `.dev.vars` も併せて書いてくれます):

```bash
pnpm --filter @toban/identity dev-token --snowflake 1 --tree-id 1
cat pkgs/extensions/identity/.dev-keys/verifier-public.pem    # → identity の secret
cat pkgs/extensions/identity/.dev-keys/verifier-private.pem   # → discord-bot の secret
```

両ファイルとも gitignore 済みです。discord-bot のデプロイガイドが秘密鍵側を参照します。production では新しい keypair を生成して dev keys は破棄してください (`openssl ecparam -name prime256v1 -genkey -noout` → SPKI 派生)。

### Step 5 — production の secret 投入

`DISCORD_BOT_VERIFIER_PUBLIC_KEY` と `RPC_URL` はコミットしません (後者は API key を含む)。Cloudflare Workers Secrets として設定します。

**公開鍵 (複数行 PEM)** — CLI プロンプトは環境によって改行を取りこぼすことがあります。確実なのは:

```bash
# A. ファイルから pipe (Bash, zsh):
cd pkgs/extensions/identity
pnpm exec wrangler secret put DISCORD_BOT_VERIFIER_PUBLIC_KEY \
  < .dev-keys/verifier-public.pem

# B. Cloudflare dashboard:
#    dash.cloudflare.com → Workers & Pages → toban-identity → Settings →
#    Variables and Secrets → Add (encrypted) → 複数行 PEM を貼り付け。
```

**RPC URL (単一行)**:

```bash
echo -n "https://eth-sepolia.g.alchemy.com/v2/<key>" \
  | pnpm --filter @toban/identity exec wrangler secret put RPC_URL
```

### Step 6 — デプロイ

```bash
pnpm --filter @toban/identity deploy
```

出力にデプロイ先 URL (`https://toban-identity.<account>.workers.dev`) が出ます。動作確認:

```bash
curl -s https://toban-identity.<account>.workers.dev/health
# → {"ok":true}
```

bot Worker が古い identity URL でデプロイ済みでも修正は不要です。bot からは URL ではなく service binding (`env.IDENTITY`) で叩くので、identity 側の再デプロイは透過的に反映されます。

### Step 7 — discord-bot 側との連携確認

discord-bot 側の `wrangler.toml` に以下があります:

```toml
[[services]]
binding = "IDENTITY"
service = "toban-identity"
```

この `toban-identity` という名前が **この package の `wrangler.toml` の `name =`** と完全一致している必要があります。リネームしたら両方更新 + bot 側を再デプロイ。

bot 側にも上で設定した公開鍵に対応する `VERIFIER_PRIVATE_KEY` を投入する必要があります — 対称の手順が [discord-bot README: デプロイ手順](../discord-bot/README.md#デプロイ手順) にあります。

### 環境を増やすとき

`wrangler.toml` には 1 つの `[[d1_databases]]` ブロックしかありません。staging vs production を分けたいときは `[env.staging]` / `[env.production]` セクションを使うのが Cloudflare 公式パターンです ("Wrangler environments" 参照)。MVP の今は 1 環境で足りるので、Base mainnet 移行時にあらためて検討してください。

## 新しい provider を追加する

1. `src/providers/<name>.ts` を作って `verifyVerifierToken` を持つ `ProviderDefinition` を export。`verify.ts` のデフォルト JWT verifier は ES256 issuer なら再利用できます。
2. `src/providers/index.ts` の registry に登録。
3. verifier のテスト (正常系 + expired + tampered + issuer 不一致) を追加。
4. issuer + token のフォーマットを本 README に追記。

`handlers/connect.ts` は provider 非依存に保ってください。provider 別の分岐をそこに足さない方針です。

## 重要な不変条件

- **Privy は identity oracle ではない**。frontend は EIP-712 署名できる wallet を取得する目的でしか Privy を使わず、`linkedAccounts` は参照しません。
- **Discord bot は authoritative ではない**。bot は (特権を持った) 一クライアントに過ぎず、新しい extension は対等な仲間です。
- **wallet は checksum 形式で保存** することで読み手側の checksum 再計算を不要にしています。
- **nonce は BLOB として保存**。PRIMARY KEY で single-use を強制しつつ、ハンドラ側で `isNonceUsed` を先に呼ぶことで、二重利用は制約違反ではなく `nonce_reused` エラーコードとして返ります。
- **D1 トランザクションは使わない** (D1 のトランザクションは GA 前)。connect ハンドラでは nonce の挿入が衝突で先に失敗してから identity の upsert が観測される順序になるよう書き分けてあります。
