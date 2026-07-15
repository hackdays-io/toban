# Toban デプロイ手順書（全レイヤー / 全ネットワーク）

Toban は **コントラクト → インデクサー → フロントエンド / Cloudflare Workers → Turnkey → Discord**
が一列に依存する多層構成です。1レイヤーだけ更新すると簡単に壊れるため、このドキュメントを
**唯一の正**として、依存順に沿って実施してください。

- 個別の深掘り: [`pkgs/contract/README.md`](../pkgs/contract/README.md) /
  [`pkgs/subgraph/README.md`](../pkgs/subgraph/README.md) /
  [`pkgs/extensions/discord-bot/docs/turnkey-setup.md`](../pkgs/extensions/discord-bot/docs/turnkey-setup.md)
- **つまづきポイント集（症状→原因→対処）**:
  [`pkgs/extensions/discord-bot/docs/deploy-base-production.md`](../pkgs/extensions/discord-bot/docs/deploy-base-production.md)
  ← 詰まったらまずここ
- 鍵のローテーション: [`pkgs/extensions/discord-bot/docs/key-rotation.md`](../pkgs/extensions/discord-bot/docs/key-rotation.md)

---

## 0. 全体像と依存関係

```
[1] contract  ──┬─→ [2] sync:abis ──┬─→ [3] subgraph ──→ [4] frontend (codegen)
                │                   │
                │                   └─→ (bot の chain.ts ABI)
                │
                └─→ [6] Turnkey policy (selector / registry tag)
                                          │
[5] Cloudflare:  identity Worker ─────────┴─→ discord-bot Worker ──→ [7] Discord
                 （必ず identity が先）
```

**守るべき順序（破ると壊れる）**

| # | 依存 | 破ったときの症状 |
|---|---|---|
| 1→2 | コントラクト変更後は必ず `sync:abis` | フロントの `parseEventLogs` が一致せずワークスペース作成が失敗 |
| 2→3 | subgraph の ABI/config を更新してから deploy | イベントが index されない |
| 3→4 | subgraph を deploy してから `frontend codegen` | gql 型に新フィールドが無く typecheck が落ちる |
| 5 | **identity → discord-bot** の順 | bot deploy が Cloudflare `error 10143`（service binding 先が無い） |
| 1→6 | 新しい関数を bot が呼ぶなら Turnkey ポリシー更新 | Turnkey が署名を拒否（`No policies evaluated to outcome: Allow`） |

---

## 1. ネットワーク早見表

| | **Sepolia（staging）** | **Base（production）** |
|---|---|---|
| Chain ID | `11155111` | `8453` |
| コントラクト鍵 | `PRIVATE_KEY` | **`PRODUCTION_PRIVATE_KEY`**（別鍵） |
| subgraph | `toban-sepolia/1.0.3` | `toban-base/0.0.1` |
| Cloudflare アカウント | `kawabeyuki23`（`225895f1…`） | **同左（同一アカウント）** |
| Worker（bot） | `toban-discord-bot`（top-level） | `toban-discord-bot-base`（`--env base`） |
| Worker（identity） | `toban-identity`（top-level） | `toban-identity-base`（`--env base`） |
| D1 | `toban-identity`（`6332ba44-…`） | `toban-identity-base`（`bf40df4f-…`） |
| Turnkey bot signer | `0xae4E13De7C14Dff7ff296De69cADf3A7F5208461` | `0xE21E99d384409e119cee731D368359BDc719a5f0` |
| Hats subgraph | Goldsky（自前・キー不要） | The Graph Gateway（**APIキー入り＝secret**） |

> ⚠️ **Sepolia は「top-level 設定」がそのままデプロイ対象**です（`[env.sepolia]` は存在しません）。
> Base だけが named environment（`--env base`）。

**Sepolia と Base は同一 Cloudflare アカウント**にあり、**worker 名と D1 で分離**されています
（アカウントでは分けていません）。D1 を分けているのは、`platform_links` が guild → treeId を
持ち treeId はチェーン固有のため、共有すると Sepolia のテストデータが Base 本番に混ざるからです。

### Cloudflare のエラー: 症状 → 原因

| 症状 | 原因 |
|---|---|
| `Service binding 'IDENTITY' references Worker '…' which was not found [10143]` | **identity Worker が未デプロイ**。identity → bot の順で deploy する |
| `D1 binding 'DB' references database '<id>' which was not found [10181]` | その D1 が**このアカウントに無い**。エラー URL 中の `/accounts/<id>/` が意図したアカウントか確認。新環境なら `wrangler d1 create <name>` して `database_id` を更新 |
| `Authentication error [10000]` | wrangler が別アカウントを見に行っている（既知の不具合）。`wrangler whoami` で確認 |

> ⚠️ **`CLOUDFLARE_ACCOUNT_ID` を export したまま放置しないこと。** wrangler がそのアカウントに
> 固定され、別アカウントを触るときに上記 10181 / 10143 を踏みます。使ったら `unset` する。

### ⚠️ 無視してよい警告（直すと壊れる）

`deploy:base` 時に必ず出ます:
```
"vars.HATS_GRAPHQL_ENDPOINT" exists at the top level, but not on "env.base.vars".
```
**これは意図どおりです。** Base の Hats エンドポイントは The Graph Gateway の URL で
**API キーを含むため secret** として投入しています。警告に従って `[env.base.vars]` に
追記すると、**平文の var が secret を上書き**してしまい壊れます
（[deploy-base-production.md §1](../pkgs/extensions/discord-bot/docs/deploy-base-production.md)）。

---

## 2. レイヤー1: コントラクト

### 2-1. 変更内容に応じて「upgrade」か「新規デプロイ」かを選ぶ

| 変更内容 | 手段 | BigBang アドレス |
|---|---|---|
| BigBang のロジック/イベントのみ | `upgrade:BigBang`（UUPS） | **据え置き** |
| Hats モジュール impl のみ（例: HatsQuestModule） | `swapQuestModuleImpl.ts` 等 | 据え置き |
| 全部作り直したい / 既存を切り離したい | `deploy:all`（CREATE2） | **変わる** |

`deploy:all` は CREATE2 なので、**bytecode が変わっていないコントラクトは既存アドレスを再利用**
（`already deployed at ...` と表示してスキップ）します。BigBang は impl が変わると proxy の
initcode も変わるため **アドレスが変わります**。

### 2-2. 実行

```bash
# 事前確認（残高・チェーン）
pnpm contract getBalance   --network <sepolia|base>
pnpm contract getChainInfo --network <sepolia|base>   # ← 出た block を subgraph の startBlock に使う

pnpm contract compile
pnpm contract test

# (a) 全部新規（アドレスが変わる）
npx hardhat run scripts/deploy/create2.ts --network <net>   # pkgs/contract で実行

# (b) BigBang だけ upgrade（アドレス据え置き）
npx hardhat run scripts/upgrade/bigbang.ts --network <net>

# (c) Quest モジュール impl だけ差し替え
npx hardhat run scripts/deploy/swapQuestModuleImpl.ts --network <net>
```

デプロイされたアドレスは `pkgs/contract/outputs/contracts-<net>.json` に自動記録されます
（`upgrade:BigBang` は impl を記録しないので、必要なら手で追記）。

### 2-3. 検証

```bash
# UUPS upgrade 後は proxy の implementation slot が新 impl を指しているか必ず確認
# slot: 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
```

### 2-4. コスト目安
Base は blob により L1 データ手数料がほぼ無料。`deploy:all`（全11コントラクト、147KB）で
**約 0.0002 ETH**。残高が数 mETH あれば足ります。

---

## 3. レイヤー2: ABI 同期 ★忘れると本番が壊れる

コントラクトを変更したら**必ず**実行します。frontend / subgraph の ABI コピーを
artifacts から再生成します。

```bash
pnpm contract compile
pnpm contract sync:abis      # → pkgs/frontend/abi/*.ts, pkgs/subgraph/abis/*.json
pnpm biome:format pkgs/frontend/abi/ pkgs/subgraph/abis/   # 生成物をリポジトリ体裁に戻す
```

> **なぜ致命的か**: `BigBang.Executed` にフィールドを1つ足しただけで topic0（イベント署名ハッシュ）
> が変わります。`pkgs/frontend/abi/bigbang.ts` が古いままだと `useBigBang` の
> `parseEventLogs({strict:true})` が**一致せず undefined** になり、tx は成功しているのに
> **ワークスペース作成が必ず失敗**します。手書きで ABI を直さず、必ず `sync:abis` を使ってください。

同様に、bot が新しい関数を呼ぶ場合は `pkgs/extensions/discord-bot/src/chain.ts` の
ABI フラグメント（このパッケージの ABI の唯一の正）も更新します。

---

## 4. レイヤー3: サブグラフ（インデクサー）

### 4-1. config を更新

`pkgs/subgraph/config/<net>.json`:
- コントラクトを**新規デプロイした場合** → `address` を新アドレスに
- `startBlock` → デプロイ直前のブロック番号
- イベント署名を変えた場合 → `handlers[].event` の署名文字列を更新

> ⚠️ **`startBlock` は全 data source 共通のグローバル値**です。上げると BigBang 以外
> （ScheduledDistributorFactory など）の履歴も切り捨てられます。

### 4-2. ⚠️ イベント署名を変えたときの破壊的影響

graph-node はイベントを **topic0（署名ハッシュ）** で照合します。`Executed` に引数を足すと
**旧コントラクトが emit 済みのイベントは新 config では一切マッチしません**。

→ 既存ワークスペースは**インデックスから消えます**。選択肢:
- **(A) 作り直してよい**: subgraph を delete → 新 `startBlock` で再デプロイ（今回の #531 はこれ）
- **(B) 既存を残したい**: 旧署名と新署名の**両方**の handler を登録し、旧用に
  `handleExecutedLegacy`（新フィールドを 0 で埋める）を実装する

### 4-3. 実行

```bash
pnpm subgraph delete:<net>     # 作り直す場合のみ（--force で無確認）
pnpm subgraph prepare:<net>    # config + template → subgraph.yaml（yaml は gitignore）
pnpm subgraph codegen
pnpm subgraph build
pnpm subgraph deploy:<net>     # 要 `goldsky login`
```

### 4-4. 検証

```bash
curl -s -X POST "<GOLDSKY_ENDPOINT>" -H "content-type: application/json" \
  -d '{"query":"{_meta{block{number} hasIndexingErrors} workspaces(first:3){id}}"}'
```
`hasIndexingErrors: false` かつ `_meta.block.number` が伸びていればOK。

---

## 5. レイヤー4: フロントエンド

**サブグラフを deploy した後で** gql 型を再生成します（順序必須）。

```bash
# codegen は VITE_GOLDSKY_GRAPHQL_ENDPOINT（.env / .env.base）のスキーマを読む
pnpm frontend codegen
pnpm frontend typecheck
```

コントラクトを新規デプロイしてアドレスが変わった場合は先に更新:
- `pkgs/frontend/.env`（sepolia） / `.env.base`（Base）の `VITE_BIGBANG_ADDRESS` など

> **落とし穴**: subgraph に無いフィールドを gql クエリに足すと、そのネットワークでは
> GraphQL バリデーションエラーになり `useGetWorkspace` が全滅します。
> **両ネットワークの subgraph スキーマを揃えてから**フロントを出してください。

---

## 6. レイヤー5: Cloudflare Workers

### 6-1. 順序：identity → discord-bot（必須）

bot は `IDENTITY` service binding で identity Worker を**名前で**参照します。
identity が未デプロイのまま bot を deploy すると:

```
✘ Service binding 'IDENTITY' references Worker 'toban-identity-base'
  which was not found. [code: 10143]
```

### 6-2. コマンド

```bash
# Sepolia（top-level 設定）
pnpm --filter @toban/identity    deploy:sepolia
pnpm --filter @toban/discord-bot deploy:sepolia

# Base（--env base / 別 Cloudflare アカウントに login してから）
pnpm --filter @toban/identity    deploy:base
pnpm --filter @toban/discord-bot deploy:base
```

> ⚠️ **`pnpm --filter X deploy` は使えません。** `deploy` は pnpm のビルトインコマンド
> （`ERR_PNPM_INVALID_DEPLOY_TARGET`）と衝突します。必ず `deploy:sepolia` / `deploy:base`
> を使ってください（どうしても素の script を叩くなら `pnpm --filter X run deploy`）。

### 6-3. D1 マイグレーション（初回のみ）

```bash
pnpm --filter @toban/identity db:migrate:remote:sepolia
pnpm --filter @toban/identity db:migrate:remote:base
```

### 6-4. Secrets

Worker 名ごとにスコープされるので**環境ごとに投入**します。`--env` 無し = Sepolia。

**identity**: `DISCORD_BOT_VERIFIER_PUBLIC_KEY` / `RPC_URL` / `LOOKUP_READ_SECRET` /
`PLATFORM_LINK_WRITE_SECRET`

**discord-bot**: `DISCORD_APP_ID` / `DISCORD_PUBLIC_KEY` / `DISCORD_BOT_TOKEN` /
`DISCORD_CLIENT_SECRET` / `TURNKEY_API_PUBLIC_KEY` / `TURNKEY_API_PRIVATE_KEY` /
`VERIFIER_PRIVATE_KEY` / `INSTALL_STATE_SECRET` / `LOOKUP_READ_SECRET` /
`PLATFORM_LINK_WRITE_SECRET` / `RPC_URL` /（Base のみ）`HATS_GRAPHQL_ENDPOINT`

```bash
# 改行が混ざると壊れるのでファイル/printf で流し込む
printf '%s' "$VALUE" | pnpm --filter @toban/discord-bot exec wrangler secret put NAME --env base
```

**共有シークレット**（`LOOKUP_READ_SECRET` / `PLATFORM_LINK_WRITE_SECRET`）は
**identity と discord-bot で同一値**にしないと `/balance` 等が 401 になります。

> secret は投入即反映（再デプロイ不要）。`vars` とコード変更は再デプロイが必要。
> 詳しい落とし穴は
> [deploy-base-production.md](../pkgs/extensions/discord-bot/docs/deploy-base-production.md) 参照。

---

## 7. レイヤー6: Turnkey（**手動・適用しないと bot が署名できない**）

`pkgs/extensions/discord-bot/turnkey/policy.json` は**リポジトリ内の source of truth であって、
自動適用されません**。Turnkey org 側に反映する必要があります。

### 7-1. bot が署名する操作（現在）

| 操作 | selector | tx `to` |
|---|---|---|
| `/thx` → `mintFrom(address,address,uint256,(uint256,address)[],bytes)` | `0x40062e89` | ThanksToken クローン |
| `/quest submit` → `submitCompletion(address,uint256,uint256)` | `0x947ec45f` | **HatsQuestModule クローン** |

### 7-2. 必要な作業

1. **ポリシーを適用**し、bot 署名鍵（**non-root** API user）にアタッチ
   - `ACTIVITY_TYPE_SIGN_TRANSACTION_V2` に固定（raw payload 署名は不可）
   - `eth.tx.chain_id`・`to`・selector・`value == 0` で制限
2. **タグ集合をシード**（MVP は手動。subgraph 連動 cron は未実装）
   - `toban-thanks-token-registry` ← ThanksToken クローンアドレス
   - `toban-quest-module-registry` ← **HatsQuestModule クローンアドレス**（**impl ではない**）
   - `toban-identity-bound-wallets` ← 申請者/送信者の連携ウォレット
3. 新しいワークスペースを作るたびに、その **クローンアドレス** をレジストリタグに追加

クローンアドレスは subgraph から取得できます:
```bash
curl -s -X POST "<GOLDSKY_ENDPOINT>" -H "content-type: application/json" \
  -d '{"query":"{workspace(id:\"<treeId>\"){hatsQuestModule thanksToken{id}}}"}'
```

> ⚠️ Turnkey の **root user はポリシーをバイパス**します。bot は必ず non-root の API user に。
> セットアップ詳細: [turnkey-setup.md](../pkgs/extensions/discord-bot/docs/turnkey-setup.md)

---

## 8. レイヤー7: Discord

### 8-1. bot をギルドに招待（`applications.commands` スコープ必須）
```
https://discord.com/api/oauth2/authorize?client_id=<APP_ID>&scope=bot%20applications.commands&permissions=2048
```
`bot` スコープだけで招待済みだと、コマンド登録が `403 / 50001 Missing Access` になります。
同じ URL を開き直して再認可すればスコープが追加されます。

### 8-2. スラッシュコマンドを登録

**既にインストール済みのギルドには新コマンドが自動反映されません。** 手動登録が必要です。

```bash
DISCORD_APP_ID=<app-id> DISCORD_BOT_TOKEN=<bot-token> \
  pnpm --filter @toban/discord-bot register-commands <guild-id>
```

新しいコマンドを足すときは **`scripts/register-commands.ts` と
`src/api/install/callback.ts`（COMMANDS_PAYLOAD）の両方**に追加してください
（後者は新規インストール時の登録に使われます）。

---

## 9. リリース後チェックリスト

```bash
# 1. コントラクト
pnpm contract test                       # 全 pass
# proxy の implementation slot が新 impl か

# 2. ABI
git diff --stat pkgs/frontend/abi/ pkgs/subgraph/abis/   # sync:abis の差分が入っているか

# 3. subgraph（両ネットワーク）
curl … '{_meta{block{number} hasIndexingErrors}}'        # errors:false / block が伸びる

# 4. frontend
pnpm frontend typecheck && pnpm frontend build

# 5. Cloudflare
pnpm --filter @toban/discord-bot exec wrangler tail --format pretty          # sepolia
pnpm --filter @toban/discord-bot exec wrangler tail --env base --format pretty
#   → Discord でコマンドを実行し、console.* と未捕捉例外を確認

# 6. Turnkey
#   → 実際に /thx と /quest submit を1回ずつ通す（ポリシー拒否は tail に出る）
```

---

## 10. 現在の正（2026-07 時点）

| | Sepolia | Base |
|---|---|---|
| BigBang | `0x010329e42cAc221D799C105516830D84901Dc2Ac`（UUPS upgrade 済） | `0xda7BFDb08e09Bb3ba0bC8e37c5c322328E458003`（新規） |
| BigBang impl | `0xD91A21d104DB994572cEE83aD73cc745A4582f41` | 同左 |
| HatsQuestModule impl | `0x84988CD2DdaC2137C9DF6b679341F0F180D9aaf2` | 同左 |
| subgraph | `toban-sepolia/1.0.3` | `toban-base/0.0.1` |

コントラクトアドレスの一次情報は `pkgs/contract/outputs/contracts-<net>.json` です。
