# `@toban/discord-bot`

**Toban Discord bot** を動かす Cloudflare Worker です。Discord のスラッシュコマンド (`/toban-link`, `/toban-setup`, `/balance`, `/thx`, `/quest submit`) に応答し、呼び出し元に代わって ThanksToken の mint とクエスト完了報告を on-chain で実行します。Worker 自体には Ethereum の秘密鍵は **一切置きません** — `mintFrom` の署名は Turnkey の TEE 内で行われ、Turnkey の policy engine で関数選択子レベルに制限されています。

bot は [`@toban/identity`](../identity/README.md) と対になっています。identity 側は `(Discord snowflake) ↔ wallet` と `(Discord guild) ↔ Toban workspace` の bind を所有していて、この bot はその HTTP API を service binding 経由で叩きます。この README だけで bot を運用できますが、identity 側に依存するパートでは随所にリンクを置いています。

## TL;DR

```
admin が bot を guild に招待
admin が /toban-link <workspace-url>      →  guild ↔ workspace を bind
各メンバーが /toban-setup                  →  Discord snowflake ↔ wallet を bind
                                              /<treeId>/discord-bot で bot に
                                              mintAllowance を approve
誰でも /thx amount user:@…                →  Turnkey 署名で mintFrom 実行
```

各ステップで bot が信頼している境界契約は以下で詳述します。

## プロジェクトオーナー視点での全体フロー

### 0. 事前準備 (一度きり)

- **Workspace が存在する**。bot は既存の Toban workspace を指す必要があるので、誰かが `pnpm contract bigbang` を (or frontend から) 実行済みで、`BigBang.Executed` event が出て Toban subgraph が `Workspace` エンティティ (`thanksToken` フィールド付き) として index していること。
- **bot Worker がデプロイ済み**。`pnpm --filter @toban/discord-bot deploy:sepolia`（本番は `deploy:base`）を実行し、Cloudflare で secret がセット済みであること (Turnkey 側は [`docs/turnkey-setup.md`](docs/turnkey-setup.md) と [`docs/key-rotation.md`](docs/key-rotation.md)、必要な `[vars]` と `# secrets:` は `wrangler.toml` を参照)。
- **identity Worker がデプロイされていて、`IDENTITY` という名前の service binding で到達可能**であること (`wrangler.toml` 参照)。同一アカウントの Workers 同士は workers.dev 経由で fetch できない (Cloudflare error 1042)。service binding が唯一の正規経路。
- **Discord application が developer portal で登録済み**:
  - `Interactions Endpoint URL` → `https://<bot-worker>/discord/interactions`
  - `OAuth2 Redirects` → `https://<bot-worker>/api/install/callback`
- **対象 guild に slash command が登録済み**。フロント起点の「サーバーに追加」（Step 1-A）を
  使ったなら**自動で登録されている**ので何もしなくて構いません。素の invite URL で入れた場合だけ、
  手動で登録します:
  ```bash
  DISCORD_APP_ID=… DISCORD_BOT_TOKEN=… \
    pnpm --filter @toban/discord-bot register-commands <guild-id>
  ```
  コマンド仕様は **`scripts/register-commands.ts` と `src/api/install/callback.ts` の
  `COMMANDS_PAYLOAD` の 2 箇所**にあり、**常に一致させる必要があります**（前者は手動登録、
  後者はインストール時の自動登録に使われます）。

### 1. bot を Discord サーバーに招待する

導線は2つあります。

**A. フロント起点 (推奨・自動)** — ワークスペースの `/<treeId>/discord-bot` 画面（管理者のみ表示）の「サーバーに追加」ボタンから。ボタンは bot Worker の `GET /api/install/start?treeId=<treeId>` に遷移し、Worker が `INSTALL_STATE_SECRET` で署名した短命の install-state JWT (`{ treeId, jti }`) を付けて Discord OAuth authorize へリダイレクトします。admin がサーバーを選んで認証すると Discord が `/api/install/callback` にリダイレクトし、callback が**ワークスペース紐付け (Step 2) とそのサーバーへの slash command 登録を自動で実行**します。`/toban-link` も手動 `register-commands` も不要。state はサーバーを事前に固定しません（admin が consent 画面で選ぶまで guild は不明なため）。callback は OAuth token 交換で Discord が返した guild をそのまま bind します。

**B. 素の invite URL (手動)** — Discord developer portal で生成した OAuth invite URL (scope: `bot` + `applications.commands`、permission: `Send Messages` 最小) を開いて認証。この場合 bot は guild に居るだけで、slash command 登録 (前提条件の `register-commands`) と紐付け (Step 2 の `/toban-link`) は手動になります。

### 2. サーバーと Toban workspace を紐づける

> フロント起点フロー (Step 1-A) を使った場合、この Step は callback が自動で済ませるので手動 `/toban-link` は不要です。

サーバー内で admin が:

```
/toban-link workspace_url:https://toban.xyz/<treeId>
```

bot がやること:

1. URL の `/<treeId>` セグメントから tree id を抽出。
2. 呼び出し元の Discord snowflake を `IDENTITY.fetch('/api/lookup?provider=discord&account_id=…')` で wallet 解決。未 onboard なら `先に /toban-setup を実行してください` を返す (Step 3 へ)。
3. `(provider=discord, platform_id=guild_id, tree_id, installed_by=caller.wallet)` を `IDENTITY.fetch('/api/platform-link', { method: 'POST', body })` で POST。
4. ephemeral で `✅ このサーバーを Toban ワークスペース <tree> に連携しました。` と返信。

裏では identity Worker が `platform_links` 行を upsert します — wire 形式とテーブルスキーマは [identity README: サーバーと workspace の紐づけ](../identity/README.md#3-サーバーと-workspace-の紐づけ----toban-link--post-apiplatform-link) を参照。

> **権限チェック**: `/toban-link` は、呼び出し元の identity-bound wallet が対象 tree の Hat を
> **1 つ以上被っている**ことを Hats subgraph で検証してから bind します（`wearsAnyHatInTree`）。
> admin Hat 限定ではなく member レベルのゲートです。
>
> 一方 **OAuth ベースの install パス (`/api/install/callback`) は未検証のまま**です。フロント起点の
> フローでは admin の wallet が分からないため、`installed_by` にゼロアドレスを記録しています
> （`callback.ts` の TODO）。Discord の「サーバーを管理」権限を持つ人しか OAuth 認可できない、
> という Discord 側の制約が事実上のゲートになっています。

### 3. 各メンバーが Discord アカウントと wallet を結びつける

メンバーが連携先 guild の任意チャンネルで `/toban-setup` を打ちます。

bot がやること:

1. **verifier_token (短命 JWT)** を発行 — ES256 で `VERIFIER_PRIVATE_KEY` (Turnkey または Workers Secret) で署名。claims は `{ iss: "toban-discord-bot", provider: "discord", accountId: <snowflake>, exp: now+15min }`。`src/verifier.ts` 参照。
2. guild の `platform_links` 行を引いて `tree_id` を取得し、後段の allowance 画面にユーザーを誘導するために URL に乗せる。
3. ephemeral DM:
   ```
   Open this link in your browser within 15 minutes to connect your wallet:
   https://toban.xyz/connect/discord?token=<jwt>&treeId=<treeId>
   ```

リンクは Toban frontend の `/connect/discord` ページに着地し、そこでユーザーは:

1. Privy login → embedded smart wallet を取得。
2. EIP-712 `IdentityBinding` (`{ wallet, provider, accountId, verifierTokenHash, expires, nonce }`) に署名。
3. verifier_token + 署名済み binding を identity の `/api/connect` に POST。

identity Worker は JWT を `DISCORD_BOT_VERIFIER_PUBLIC_KEY` で検証し、EIP-712 署名を `publicClient.verifyTypedData` (EOA / EIP-1271 smart wallet / ERC-6492 counterfactual を統一処理) でチェックして、`identities` に `(discord, snowflake) → wallet` を upsert します。詳細は [identity README: identity binding](../identity/README.md#2-identity-binding--toban-setup--connectdiscord)。

bind が成立すると frontend が `/<treeId>/discord-bot` に遷移させ、ユーザーは workspace の ThanksToken に対して `approveMint(<bot-signer-address>, amount)` を打ちます。`/thx` 以外でユーザーが行う唯一の on-chain アクションがこれで、bot は mint のたびにこの allowance を読みに行きます。

### 4. bot signer のセットアップ (環境ごとに 1 回)

bot は `mintFrom` 署名を **Turnkey が管理する Ethereum 秘密鍵** で行います。Worker は Turnkey の API stamper credentials (P-256 keypair) しか持ちません。運用ガイド:

- [`docs/turnkey-setup.md`](docs/turnkey-setup.md) — CLI での signing key / API stamper の発行と、policy (`turnkey/policy.json`) の適用。
- [`docs/key-rotation.md`](docs/key-rotation.md) — 計画的 + 緊急ローテーションの runbook。

`TURNKEY_BOT_SIGNER_ADDRESS` (= 生成された signer address) に少額のネイティブガスを入金します。あとはそこから流れます。

### 5. メンバーが THX を送る

```
/thx amount:5 user:@bob [address:0x… or vitalik.eth] [message:thanks]
```

`amount` と `user` は必須、`address` を指定すると `user.wallet` を上書きします。これでまだ `/toban-setup` を済ませていない相手 (ENS 名所有者など) にも送れます。bot 内部の流れ (`src/commands/thx.ts`):

1. **送信者の wallet を解決** — `IDENTITY.fetch('/api/lookup', …)` で snowflake → wallet。未 bind なら `先に /toban-setup を実行してください` を返して終了。
2. **guild の workspace を解決** — 同じ identity API で `platform_links` を引く。未 link なら `管理者に /toban-link の実行を依頼してください` を返して終了。
3. **受信者の wallet を解決**:
   - `address` が `0x…` の場合: バリデートしてそのまま使用。
   - `address` が `*.eth` の場合: Ethereum mainnet (`env.MAINNET_RPC_URL`) で ENS を resolve — ENS レコードは mint 先 chain によらず mainnet にあるため。
   - それ以外 (= USER 指定): `IDENTITY.fetch('/api/lookup', …)` で receiver の wallet を取得。
4. **workspace の現 ThanksToken アドレスを解決** — bot は token address を env に焼かない。workspace ごとに clone を持ち、独立に乗せ換え可能にするため、`GOLDSKY_GRAPHQL_ENDPOINT` から `Workspace.thanksToken.id` を読みます。
5. **`mintAllowance(sender, botSigner)` を読み取り**。足りなければ `/<treeId>/discord-bot` のリンクを添えてエラーを返す。
6. **`relatedRoles` を組み立て** — ThanksToken の `mintableAmount` 公式は FractionToken の share 残高 + hat の wearing time で駆動。bot は以下を query して合成:
   - Toban subgraph (`balanceOfFractionTokens` を `owner, workspaceId` でフィルタ),
   - Hats subgraph (`tree(id).hats[wearers.id == sender]`),
   contract が期待する `(hatId, wearer)[]` の形に。
7. **Turnkey で `mintFrom(sender, recipient, amount * 1e18, relatedRoles, data)` を署名** して `env.RPC_URL` にブロードキャスト。
8. **followup** で tx hash + 額 + 受信者を Discord に返す。

Discord INTEGER で渡される `amount` は bot 側で `1e18` 倍 (ThanksToken は 18 decimal の ERC-20 のため)。`/balance` は逆に `formatEther` で人間可読 THX に戻して表示。

## bot ↔ identity の wire 契約 (チートシート)

| 操作 | 方向 | エンドポイント | 備考 |
|---|---|---|---|
| verifier_token 発行 | bot 内部 | `src/verifier.ts` (ES256 JWT) | identity 側は `DISCORD_BOT_VERIFIER_PUBLIC_KEY` で検証 |
| snowflake → wallet 解決 | bot → identity | `GET /api/lookup?provider&account_id` | 404 は未 bind |
| guild → workspace 解決 | bot → identity | `GET /api/platform-link?provider&platform_id` | 404 は未 link |
| guild ↔ workspace 登録 | bot → identity | `POST /api/platform-link` | body: `{ provider, platformId, treeId, installedBy }` |
| wallet ↔ snowflake 登録 | frontend → identity | `POST /api/connect` | bot は介入しない — identity README 参照 |

bot → identity の通信はすべて `env.IDENTITY.fetch(...)` (service binding) 経由。レスポンス形は [identity README: HTTP API 一覧](../identity/README.md#http-api-一覧)。

## 構成

```
src/
  index.ts                  Workers entry; /discord/interactions,
                            /api/install/start, /api/install/callback を
                            ルーティング
  env.ts                    Env / bindings 型
  interactions/verify.ts    Ed25519 検証 (crypto.subtle、tweetnacl 不使用)
  verifier.ts               ES256 verifier_token issuer (/toban-setup 用)
  chain.ts                  viem client + ThanksToken / HatsQuestModule の
                            ABI fragment + subgraph resolver (workspace ごとの
                            ThanksToken address、relatedRoles、ENS)
  identity.ts               IdentityClient interface + service-binding HTTP
                            client
  signer/turnkey.ts         Turnkey API stamper 認証 + LocalAccount wrapper
  commands/
    payload.ts              slash command 定義の唯一の正 (登録経路 2 つが共有)
    toban-setup.ts          verifier_token 発行 + DM リンク
    toban-link.ts           guild → tree_id を直接 bind
    balance.ts              mintAllowance + mintable budget (THX 単位) 表示
    thx.ts                  /thx の end-to-end (resolve, check, sign, send)
    quest-submit.ts         /quest submit + quest の autocomplete
    responses.ts            Discord response / followup ヘルパー
  api/install/start.ts      install-state JWT を署名し Discord OAuth へ
                            リダイレクト (frontend 起点フローの入口)
  api/install/callback.ts   OAuth bot-install callback: 紐付け + command 登録
turnkey/
  policy.json               適用可能な policy 定義 (版管理・唯一の正)
  apply-policy.sh           policy.json を Turnkey に冪等適用する
docs/
  turnkey-setup.md          CLI での signer / stamper / policy provisioning
  key-rotation.md           scheduled + emergency rotation runbook
scripts/
  register-commands.ts      commands/payload.ts を guild に手動登録する CLI
test/                       Vitest unit tests (network なし、chain なし)
```

## コマンド

```
pnpm --filter @toban/discord-bot dev               # wrangler dev (local)
pnpm --filter @toban/discord-bot test              # vitest run
pnpm --filter @toban/discord-bot typecheck         # tsc --noEmit
pnpm --filter @toban/discord-bot deploy:sepolia    # → toban-discord-bot       (top-level 設定)
pnpm --filter @toban/discord-bot deploy:base       # → toban-discord-bot-base  (--env base)
pnpm --filter @toban/discord-bot deploy:dry:sepolia
pnpm --filter @toban/discord-bot deploy:dry:base
pnpm --filter @toban/discord-bot register-commands <guild>
```

> ⚠️ **素の `deploy` スクリプトはありません。** `pnpm --filter <pkg> deploy` は pnpm の
> ビルトインと衝突して `ERR_PNPM_INVALID_DEPLOY_TARGET` になります。

## デプロイ手順

end-to-end のデプロイは 3 つの外部サービス (Cloudflare、Turnkey、Discord) + identity Worker を扱います。identity を先にデプロイしてください ([identity README: デプロイ手順](../identity/README.md#デプロイ手順))。以降は identity が同じ Cloudflare アカウントで到達可能な状態を前提とします。

> **Base 本番のデプロイ**と、実際にハマった落とし穴（鍵フォーマット、Turnkey policy と sign_transaction、Hats subgraph の Gateway/ドメイン制限、var が secret を上書きする件、`/thx` の followup 2000字制限 など）は [`docs/deploy-base-production.md`](docs/deploy-base-production.md) にまとめてあります。本番作業前に一読してください。

### Step 1 — Cloudflare 前準備

identity 側と同じ。すでに `wrangler login` 済みなら何もしなくて OK:

```bash
pnpm --filter @toban/discord-bot exec wrangler whoami
```

### Step 2 — Turnkey: signing key + API stamper + policy

Turnkey は bot の Ethereum 署名鍵を TEE 内に保持します。Worker は API stamper の P-256 keypair しか持たず、policy engine で 2 つの関数セレクタ以外の呼び出しは構造的に拒否される設計です。

> **Turnkey の操作は CLI で行います。** ダッシュボードを使うのは org の初回作成と root ユーザーの passkey 登録だけ。GUI で作業すると `turnkey/policy.json` と実態がずれます。
> **手順の正は [`docs/turnkey-setup.md`](docs/turnkey-setup.md) です。** ここは流れの要約だけ。

```bash
brew install tkhq/tap/turnkey
export TK_ORG=<organization-id>          # wrangler.toml の TURNKEY_ORGANIZATION_ID と同じ値
export TK_ADMIN_KEY=toban-turnkey-admin  # root user に紐づく管理用 API キー

# 1. 署名ウォレット（bot が from として署名するアドレス）
turnkey wallets create --name "Toban Discord Bot Main" -k "$TK_ADMIN_KEY" --organization "$TK_ORG"
turnkey wallets accounts create --wallet "Toban Discord Bot Main" \
  --address-format ADDRESS_FORMAT_ETHEREUM -k "$TK_ADMIN_KEY" --organization "$TK_ORG"
#    → 出たアドレスを wrangler.toml の TURNKEY_BOT_SIGNER_ADDRESS へ。ネイティブガスを入金。

# 2. stamper の鍵ペア（形式変換は不要 — 圧縮 66hex と <64hex>:p256 がそのまま出る）
turnkey generate api-key --organization "$TK_ORG" --key-name toban-discord-bot-base

# 3. bot ユーザー（必ず non-root。root はポリシーをバイパスする）
#    → turnkey-setup.md §4 の create_users

# 4. ポリシー適用（冪等。create/update をスクリプトが選ぶ）
./turnkey/apply-policy.sh base --dry-run
./turnkey/apply-policy.sh base
```

`turnkey/policy.json` が許可内容の唯一の正です。ローテーション手順は [`docs/key-rotation.md`](docs/key-rotation.md)。

### Step 3 — Discord developer portal

1. https://discord.com/developers/applications → **New Application** → 名前を入力。dashboard に以下が出ます:
   - **Application ID** → `DISCORD_APP_ID` (secret)
   - **Public Key** → `DISCORD_PUBLIC_KEY` (secret) — `interactions/verify.ts` の Ed25519 署名検証で使う
2. 左メニュー → **Bot** → **Reset Token** → コピー。これが `DISCORD_BOT_TOKEN` (secret)。Discord は 1 度しか見せてくれません。
   - Privileged Gateway Intents: **OFF** のままで OK。bot は interactions のみで、gateway event は使いません。
3. 左メニュー → **OAuth2** → **Reset Secret** → コピー。これが `DISCORD_CLIENT_SECRET` (secret) — `/api/install/callback` が OAuth code を交換するときに使います。
4. **OAuth redirect URL を追加**:
   ```
   https://toban-discord-bot.<account>.workers.dev/api/install/callback
   ```
   `wrangler.toml` の `BOT_WORKER_URL` と完全一致 (末尾スラッシュ無し) させてください。まだ deploy 前でも登録だけはできます。Discord は OAuth が走るまで URL を検証しません。
5. **Interactions Endpoint URL** — **Step 5 (secret 投入) の後に設定**してください。secret が入っていないと Worker が Discord の検証 ping に署名を返せず、URL 登録が失敗します。URL は `https://toban-discord-bot.<account>.workers.dev/discord/interactions`。

### Step 4 — その他の周辺値

- `INSTALL_STATE_SECRET` — `/api/install/start` 署名 / `/api/install/callback` 検証 の install-state JWT 用 HMAC キー (同一 Worker が署名・検証するので対称 HMAC で十分)。新規生成:
  ```bash
  openssl rand -hex 32
  ```
- `VERIFIER_PRIVATE_KEY` — [identity Step 4](../identity/README.md#step-4--verifier-keypair-を生成-bot-と対称) で生成した keypair の秘密鍵側。identity に投入した公開鍵と必ずペアになっていること。同じ wizard / 呼び出しで生成した ES256 P-256 のペアは保証されてマッチします。
- `MAINNET_RPC_URL` — `/thx` の ENS 解決用 Ethereum mainnet RPC。free tier の Alchemy / Infura 推奨。公開 RPC の一部は ENSIP-10 呼び出しを拒否します。
- `RPC_URL` + `CHAIN_ID` — bot が tx を打つ chain。staging は Sepolia (`11155111`)、production は Base (`8453`)。
- `GOLDSKY_GRAPHQL_ENDPOINT`, `HATS_GRAPHQL_ENDPOINT` — 対象 chain の subgraph URL。Sepolia 値は `wrangler.toml` に書いてあるので、Base mainnet に上げるときは production subgraph URL に差し替えてください (repo-root の `README.md` の deployment targets セクション参照)。
- `IDENTITY_WORKER_URL` — identity Worker の公開 URL。production では documentation 用のみ (実通信は service binding 経由) ですが、念のため identity の deploy URL を入れておくと整合性が取れます。

### Step 5 — secret を投入する

**投入する secret の一覧（12 本）と、それぞれの値の出どころは
[`DEPLOYMENT.md` §6-2](../../../DEPLOYMENT.md#6-2-secret-一覧) が正**です。ここで二重に列挙すると
片方が古くなるので載せません。以下は投入方法だけ。

`--env` 無しが Sepolia、`--env base` が Base です。改行が混ざると壊れるので、プロンプトに
貼らず `printf` かファイルリダイレクトで流し込みます。

```bash
cd pkgs/extensions/discord-bot

# 1 行の値（Discord 系、Turnkey stamper、共有シークレット、RPC_URL など）
printf '%s' "<VALUE>" | pnpm exec wrangler secret put DISCORD_BOT_TOKEN

# Turnkey stamper は .private の `:p256` を落として投入する
K=~/.config/turnkey/keys/<stamper-key-name>
printf '%s' "$(cat $K.public)"          | pnpm exec wrangler secret put TURNKEY_API_PUBLIC_KEY
printf '%s' "$(cut -d: -f1 $K.private)" | pnpm exec wrangler secret put TURNKEY_API_PRIVATE_KEY

# 複数行の PEM（verifier 秘密鍵）
pnpm exec wrangler secret put VERIFIER_PRIVATE_KEY < verifier.key.pem

# 自分で生成する値
openssl rand -hex 32 | pnpm exec wrangler secret put INSTALL_STATE_SECRET
```

`LOOKUP_READ_SECRET` と `PLATFORM_LINK_WRITE_SECRET` は
**identity Worker と同じ値**にしてください（ずれると `/balance` などが 401 になります）。

投入済みの名前は `pnpm exec wrangler secret list [--env base]` で確認できます（値は見えません）。

### Step 6 — `wrangler.toml` の var を埋める

`pkgs/extensions/discord-bot/wrangler.toml` を開いて:

ここに入るのは**公開してよい値だけ**です。鍵を含む値は Step 5 の secret 側にあります。

```toml
[vars]
GOLDSKY_GRAPHQL_ENDPOINT   = "https://.../toban-<chain>/<version>/gn"
HATS_GRAPHQL_ENDPOINT      = "https://.../hats-v1-sepolia/<version>/gn"  # Base では secret
TOBAN_FRONTEND_URL         = "https://toban.xyz"     # dev は http://localhost:5173
CHAIN_ID                   = "8453"                  # Sepolia なら 11155111
MAINNET_RPC_URL            = "https://eth-mainnet.g.alchemy.com/v2/<key>"
TURNKEY_API_BASE_URL       = "https://api.turnkey.com"
TURNKEY_ORGANIZATION_ID    = "<UUID from Turnkey>"
TURNKEY_BOT_SIGNER_ADDRESS = "0x..."                 # Turnkey signing wallet の address
IDENTITY_WORKER_URL        = "https://toban-identity.<account>.workers.dev"
BOT_WORKER_URL             = "https://toban-discord-bot.<account>.workers.dev"

[[d1_databases]]
database_id = "<identity の D1 と同じ ID>"

[[services]]
binding = "IDENTITY"
service = "toban-identity"     # identity の wrangler.toml の `name =` と一致させる
```

### Step 7 — デプロイ

```bash
pnpm --filter @toban/discord-bot deploy:sepolia   # 本番は deploy:base
```

> 素の `deploy` は使えません（pnpm のビルトインと衝突して `ERR_PNPM_INVALID_DEPLOY_TARGET`）。
> **identity Worker を先にデプロイしてください**（service binding）。詳細は
> [`../README.md`](../README.md)。

出力に worker URL (`https://toban-discord-bot.<account>.workers.dev`) が出ます。`wrangler.toml` の `BOT_WORKER_URL` と一致しているか確認してください (一致しないと Discord OAuth redirect で蹴られます)。

### Step 8 — Discord に Interactions Endpoint URL を設定

Discord developer portal に戻り、**General Information** → **Interactions Endpoint URL** に貼り付け:

```
https://toban-discord-bot.<account>.workers.dev/discord/interactions
```

Save。Discord が検証 ping を投げてきますが、`DISCORD_PUBLIC_KEY` が入った状態の Worker は正しく署名を検証して 200 を返すので、portal にチェックマークが出ます。

### Step 9 — slash command を guild に登録

```bash
DISCORD_APP_ID=<id> DISCORD_BOT_TOKEN=<token> \
  pnpm --filter @toban/discord-bot register-commands <guild-id>
```

(token を shell history に残さないために `read -p` / `read -s -p` を使う) これは guild 限定の登録で即時反映。production で複数 guild にロールアウトしたいときは `scripts/register-commands.ts` から `--guild` セグメントを外して global 登録に切り替え (反映に 1 時間程度)。

> フロント起点の install（Step 1-A）を使う場合、この Step は callback が自動で実行するので不要です。

### コマンドを追加・変更したときの反映

1. **`scripts/register-commands.ts` と `src/api/install/callback.ts` の `COMMANDS_PAYLOAD` の
   両方**に同じ定義を追加します。片方だけだと、手動登録とインストール時登録で内容がずれます。
2. Worker を deploy します（`COMMANDS_PAYLOAD` はコードなので**再デプロイが必要**です。
   secret と違って即時反映されません）。
3. **既存ギルドへの反映**は、どちらかで行います。どちらも
   `PUT /applications/{app}/guilds/{guild}/commands` による**全置換**なので、何度実行しても安全です。
   - admin に `/<treeId>/discord-bot` の「サーバーに追加」を再実行してもらう
     （`upsertPlatformLink` は upsert、コマンド登録は無条件に走るので、再認可で最新化されます）
   - 運用側で `register-commands <guild-id>` を叩く（admin の操作が不要）

   **既にインストール済みのギルドに、新しいコマンドが自動で降ってくることはありません。**
   上のどちらかを実行するまで、そのギルドでは古いコマンド一覧のままです。

### Step 10 — bot をサーバーに招待

Discord developer portal → **OAuth2** → **URL Generator** → scopes `bot` + `applications.commands` → bot permission `Send Messages` → URL をコピー → ブラウザで開く → テストサーバーを選ぶ → 認証。

これで bot は guild に在駐します。あとはユーザー側の流れ: admin が `/toban-link <workspace-url>`、メンバーが `/toban-setup`、`/thx` まで通る、という流れです。本 README 上部の [プロジェクトオーナー視点での全体フロー](#プロジェクトオーナー視点での全体フロー) を参照。

### deploy 後の sanity check

```bash
# Worker が動いてる
curl -i https://toban-discord-bot.<account>.workers.dev/anything
#   → 404 (route は /discord/interactions, /api/install/start,
#         /api/install/callback だけ)

# identity 側の binding が見える
pnpm --filter @toban/identity exec wrangler d1 execute toban-identity --remote \
  --command="SELECT provider, account_id, wallet FROM identities LIMIT 5"

# bot signer にガスがある
cast balance <TURNKEY_BOT_SIGNER_ADDRESS> --rpc-url <RPC_URL>
```

もし `/thx` で「Bot に許可された送信枠が足りません」が出るのに approve 済みのつもりであれば、対象 workspace の ThanksToken が乗せ換えられた可能性があります — `https://<TOBAN_FRONTEND_URL>/<treeId>/discord-bot` で新 signer + 新 contract に対して approve し直すよう案内してください。

## 重要な不変条件

- **この Worker に Ethereum 秘密鍵は無い**。on-chain 署名はすべて Turnkey (TEE、AWS Nitro Enclave) 経由。Worker が持つのは Turnkey の API stamper credentials (P-256 keypair) だけで、`turnkey/policy.json` で制約されています。
- **D1 は `@toban/identity` と共有**。この package は `identities` / `platform_links` を直接書きません。identity 操作はすべて identity Worker の HTTP API、`IDENTITY` service binding 経由。
- **`src/chain.ts` が ThanksToken ABI fragment の唯一の出所**。contract が変わったらこのファイルだけ更新。
- **`turnkey/policy.json` が signer の許可動作の真実**。signer ができることを増やすコード変更には必ず policy 更新を伴わせてください。

## ランタイム制約

- Node ではなく Workers ランタイム。`crypto.subtle` (WebCrypto) を使い、Node 専用モジュールは避ける。許可された依存: `viem` / `jose` / `discord-api-types` (types only)。
- `crypto.subtle.{importKey, verify}` での Ed25519 サポートには新しい compatibility date が必要 — `wrangler.toml` は `2026-01-01` を設定済み。
- `nodejs_compat` は `Buffer` などのために有効化済み。使用は最小限に。

## 変更時の注意

- 別の秘密鍵置き場を持ち込まないこと。署名はすべて Turnkey。
- D1 を直読みして identity の HTTP 境界を迂回しないこと。
- ThanksToken address を env に焼かないこと — workspace ごとに subgraph で resolve する。
- `scripts/register-commands.ts` (および frontend 起点 install 用の `api/install/callback.ts` の `COMMANDS_PAYLOAD`) に登録せずに Discord コマンドを増やさないこと。
- secret をテスト fixture に持ち込まないこと。テストでの Ed25519 keypair は `crypto.subtle.generateKey` で実行時に生成しています。
