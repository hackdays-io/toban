# Toban デプロイ手順

**上から順に実行すれば通る、正常系だけの手順書です。** 各サービス（Cloudflare / Goldsky /
Turnkey / Discord）の設定方法、判断が要る場面、詰まったときの対処は、各パッケージの
ドキュメントに置いてあります。ここには**コマンドと環境変数**しか書きません。

| レイヤー | 詳細ドキュメント |
|---|---|
| コントラクト | [`pkgs/contract/README.md`](pkgs/contract/README.md) |
| サブグラフ | [`pkgs/subgraph/README.md`](pkgs/subgraph/README.md) |
| フロントエンド | [`pkgs/frontend/README.md`](pkgs/frontend/README.md) |
| Turnkey（署名鍵・stamper・ポリシー） | [`pkgs/extensions/discord-bot/docs/turnkey-setup.md`](pkgs/extensions/discord-bot/docs/turnkey-setup.md) |
| Cloudflare Workers（共通） | [`pkgs/extensions/README.md`](pkgs/extensions/README.md) |
| identity Worker | [`pkgs/extensions/identity/README.md`](pkgs/extensions/identity/README.md) |
| discord-bot Worker | [`pkgs/extensions/discord-bot/README.md`](pkgs/extensions/discord-bot/README.md) |
| OpenClaw（Discord エージェント / Fly.io） | [`pkgs/openclaw/README.md`](pkgs/openclaw/README.md) |
| 症状別の対処 | [`pkgs/extensions/discord-bot/docs/deploy-base-production.md`](pkgs/extensions/discord-bot/docs/deploy-base-production.md) |
| 鍵のローテーション | [`pkgs/extensions/discord-bot/docs/key-rotation.md`](pkgs/extensions/discord-bot/docs/key-rotation.md) |

---

## 依存順序

レイヤーは一列に依存しています。**飛ばすと後段が壊れます。**

```
[1] contract ──→ [2] sync:abis ──┬─→ [3] subgraph ──→ [4] frontend
                                 │
                                 └─→ [5] Turnkey ──→ [6] Workers ──→ [7] OpenClaw
                                                     identity → discord-bot
```

**[7] が [6] より後**なのは、OpenClaw が discord-bot Worker の MCP エンドポイントを
呼ぶためです。Worker が無い状態でエージェントを起こしても、読み取りも起案もできません。

変更したレイヤー以降だけを実行すれば十分です（コントラクトを触っていないなら [1]〜[3] は不要）。

**[5] が [6] より先**なのは、Turnkey で作った署名アドレスが `wrangler.toml` の
`TURNKEY_BOT_SIGNER_ADDRESS`（var）に入るためです。var はデプロイ時に焼き込まれるので、
後から入れると再デプロイが必要になります。

---

## 環境

| | Sepolia（staging） | Base（production） |
|---|---|---|
| Chain ID | `11155111` | `8453` |
| `--network` | `sepolia` | `base` |
| pnpm script 接尾辞 | `:sepolia` | `:base` |
| wrangler 設定 | **top-level**（`[env.sepolia]` は無い） | `[env.base]`（`--env base`） |

## 環境変数

| 設定場所 | 変数 |
|---|---|
| `pkgs/contract/.env` | `PRIVATE_KEY`（Sepolia） / `PRODUCTION_PRIVATE_KEY`（Base） / `ALCHEMY_API_KEY` / `ETHERSCAN_API_KEY` / `BASESCAN_API_KEY` |
| `pkgs/subgraph/config/<net>.json` | `address`（BigBang） / `startBlock` |
| `pkgs/frontend/.env`（Sepolia）<br>`pkgs/frontend/.env.base`（Base） | `VITE_BIGBANG_ADDRESS` ほか `VITE_*` / `VITE_GOLDSKY_GRAPHQL_ENDPOINT` |
| Vercel の環境変数（**`VITE_` 無し = サーバー専用**） | `NAMESPACE_API_KEY` / `NAMESPACE_MODE` / `ENS_PARENT_NAME` / `NAMESPACE_TIMEOUT_MS` |
| `pkgs/extensions/*/wrangler.toml` の `[vars]` | **公開値のみ**。`CHAIN_ID` / `GOLDSKY_GRAPHQL_ENDPOINT` / `TURNKEY_ORGANIZATION_ID` / `TURNKEY_BOT_SIGNER_ADDRESS` / `IDENTITY_WORKER_URL` / `BOT_WORKER_URL` など |
| Worker secrets（`wrangler secret put`） | 鍵・トークンを含む値すべて → **[§6-2 の一覧](#6-2-secret-一覧)** |
| shell（Turnkey 操作時） | `TK_ORG` / `TK_ADMIN_KEY` |

`[vars]` は **named environment に継承されません**。Base 用は `[env.base.vars]` に書き直します。
また、**同名の値が `[vars]` にあると deploy 時に secret を上書きします** — secret にする名前は
`vars` から完全に削除してください。

`NAMESPACE_API_KEY` は**フロントのビルド時ではなく Vercel の環境変数**に入れます（`VITE_` を
付けるとクライアントバンドルに露出する）。ローカルでは `.env` / `.env.base` に `VITE_` 無しで
書けば `vite.config.ts` が `process.env` に橋渡しします。未設定だと `/api/ens/*` が 503 を返し、
名前・アバターが一切解決されません。

---

## 1. コントラクト

```bash
pnpm contract getBalance   --network <sepolia|base>
pnpm contract getChainInfo --network <sepolia|base>   # 出た block を [3] の startBlock に使う

pnpm contract compile
pnpm contract test

# 変更内容に応じて 1 つ選ぶ（判断基準は pkgs/contract/README.md）
pnpm contract deploy:all      --network <sepolia|base>   # 全新規（BigBang アドレスが変わる）
pnpm contract upgrade:BigBang --network <sepolia|base>   # UUPS（アドレス据え置き）
```

アドレスは `pkgs/contract/outputs/contracts-<net>.json` に自動記録されます。

## 2. ABI 同期

コントラクトを変更したら**必ず**実行します。

```bash
pnpm contract sync:abis
pnpm biome:format pkgs/frontend/abi/ pkgs/subgraph/abis/
```

## 3. サブグラフ

先に `pkgs/subgraph/config/<net>.json` の `address` / `startBlock` を更新します。

```bash
pnpm subgraph prepare:<net>
pnpm subgraph codegen
pnpm subgraph build
pnpm subgraph deploy:<net>     # 要 `goldsky login`
```

## 4. フロントエンド

先に `pkgs/frontend/.env`（Sepolia） / `.env.base`（Base）のアドレス類を更新します。
codegen は **サブグラフを deploy した後**に実行します（gql 型は稼働中のスキーマから生成されるため）。

```bash
pnpm frontend codegen        # Sepolia（.env）
pnpm frontend codegen:base   # Base（.env.base）

pnpm frontend typecheck
pnpm frontend build
```

## 5. Turnkey

bot は Ethereum 秘密鍵を持ちません。tx の署名は Turnkey の TEE 内で行い、Worker は
**API stamper の鍵ペアだけ**を持ちます。つまり Worker 側に必要なのは
「stamper 鍵（secret 2 本）」と「署名アドレス（var 1 本）」です。

```bash
cd pkgs/extensions/discord-bot
export TK_ORG=<organization-id>          # wrangler.toml の TURNKEY_ORGANIZATION_ID と同じ値
export TK_ADMIN_KEY=<root ユーザーの API キー名>   # ~/.config/turnkey/keys/ 上のファイル名
```

### 5-1. 初回のみ（環境ごとに 1 回）

```bash
# (a) 署名ウォレットを作る
turnkey wallets create --name "<wallet-name>" -k "$TK_ADMIN_KEY" --organization "$TK_ORG"
turnkey wallets accounts create --wallet "<wallet-name>" \
  --address-format ADDRESS_FORMAT_ETHEREUM -k "$TK_ADMIN_KEY" --organization "$TK_ORG"
turnkey wallets accounts list --wallet "<wallet-name>" \
  -k "$TK_ADMIN_KEY" --organization "$TK_ORG" | jq -r '.accounts[].address'
#   → このアドレスを wrangler.toml の TURNKEY_BOT_SIGNER_ADDRESS に記入し、
#     対象チェーンのネイティブトークン（ガス代）を入金する

# (b) stamper 鍵ペアを作る（形式変換は不要）
turnkey generate api-key --organization "$TK_ORG" --key-name <stamper-key-name>

# (c) bot ユーザー（必ず non-root）を作り、(b) の公開鍵を紐づける
#     → turnkey-setup.md §4。返ってきた userId を turnkey/policy.json の consensus に記入
```

(b) で生成した鍵ファイルは**この時点では消さないでください**。Worker への投入は
[§6-3](#6-3-secret-の投入) で、**Worker をデプロイした後**に行います。

このうち **deploy 前に必要なのは (a) のアドレスだけ**です。`TURNKEY_BOT_SIGNER_ADDRESS` は
`wrangler.toml` の `[vars]` にあり、var はデプロイ時に焼き込まれるためです。
stamper 鍵は secret なので、デプロイ後にいつでも入れられます（投入即反映）。

### 5-2. ポリシーの適用（初回 + セレクタを変えたとき）

```bash
./turnkey/apply-policy.sh <base|sepolia> --dry-run
./turnkey/apply-policy.sh <base|sepolia>
```

> ポリシーが無い / チェーンが合っていないと、署名要求は Turnkey に 403 で拒否されます
> （`No policies evaluated to outcome: Allow`）。鍵の詳細・non-root の理由・形式のハマりどころは
> [`turnkey-setup.md`](pkgs/extensions/discord-bot/docs/turnkey-setup.md)。

## 6. Cloudflare Workers

**identity → discord-bot の順**に deploy します（bot が identity を service binding で参照）。
**secret は deploy の後**に入れます（理由は §6-3）。

```bash
# 初回のみ
pnpm --filter @toban/identity db:migrate:remote:<sepolia|base>

pnpm --filter @toban/identity    deploy:<sepolia|base>
pnpm --filter @toban/discord-bot deploy:<sepolia|base>
```

secret が未投入でも deploy は成功します（実行時に落ちるだけ）。逆に `[vars]` の値は
デプロイ時に焼き込まれるので、**var は deploy 前に `wrangler.toml` へ書いておく**必要があります。

### 6-1. 自分で生成する値

```bash
# 共有シークレット 2 本 + install state（それぞれ別の値を 1 回だけ生成して使い回す）
openssl rand -hex 32

# verifier 鍵ペア（最初から正しい形式で作る。変換工程は不要）
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out verifier.key.pem  # PKCS#8
openssl pkey -in verifier.key.pem -pubout -out verifier.pub.pem                        # SPKI
```

### 6-2. secret 一覧

**`--env base` を付けると Base、付けないと Sepolia**に入ります。**投入即反映で再デプロイ不要**です。

`@toban/identity`:

| secret | 値 |
|---|---|
| `DISCORD_BOT_VERIFIER_PUBLIC_KEY` | `verifier.pub.pem`（SPKI PEM）。bot の `VERIFIER_PRIVATE_KEY` と対 |
| `RPC_URL` | 対象チェーンの RPC URL（Alchemy キーを含む） |
| `LOOKUP_READ_SECRET` | `openssl rand -hex 32`。**bot と同一値** |
| `PLATFORM_LINK_WRITE_SECRET` | `openssl rand -hex 32`。**bot と同一値** |

`@toban/discord-bot`:

| secret | 値 |
|---|---|
| `DISCORD_APP_ID` | Discord Developer Portal → Application ID |
| `DISCORD_PUBLIC_KEY` | 同 → General Information → Public Key |
| `DISCORD_BOT_TOKEN` | 同 → Bot → Reset Token |
| `DISCORD_CLIENT_SECRET` | 同 → OAuth2 → Reset Secret |
| `TURNKEY_API_PUBLIC_KEY` | §5-1(b) の `.public`（66hex） |
| `TURNKEY_API_PRIVATE_KEY` | §5-1(b) の `.private` から `:p256` を除いた 64hex |
| `VERIFIER_PRIVATE_KEY` | `verifier.key.pem`（PKCS#8 PEM）。identity の公開鍵と対 |
| `INSTALL_STATE_SECRET` | `openssl rand -hex 32` |
| `LOOKUP_READ_SECRET` | **identity と同一値** |
| `PLATFORM_LINK_WRITE_SECRET` | **identity と同一値** |
| `RPC_URL` | 対象チェーンの RPC URL（Alchemy キーを含む） |
| `HATS_GRAPHQL_ENDPOINT` | **Base のみ**。The Graph Gateway の URL（API キーを含む） |

共有シークレット 2 本がずれると `/balance` などが 401 になります。

### 6-3. secret の投入

**Worker をデプロイした後**に実行します。改行が混ざると壊れるので、プロンプトに貼らず
`printf` かファイルリダイレクトで流し込みます。

```bash
# 1 行の値
printf '%s' "$VALUE" \
  | pnpm --filter @toban/discord-bot exec wrangler secret put LOOKUP_READ_SECRET --env base

# Turnkey stamper（§5-1(b) で生成した鍵。.private は `:p256` を落として投入する）
K=~/.config/turnkey/keys/<stamper-key-name>
printf '%s' "$(cat $K.public)" \
  | pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PUBLIC_KEY --env base
printf '%s' "$(cut -d: -f1 $K.private)" \
  | pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PRIVATE_KEY --env base

# 複数行の PEM
pnpm --filter @toban/discord-bot exec wrangler secret put VERIFIER_PRIVATE_KEY --env base < verifier.key.pem
pnpm --filter @toban/identity    exec wrangler secret put DISCORD_BOT_VERIFIER_PUBLIC_KEY --env base < verifier.pub.pem

# 投入済みの名前を確認（値は見えません）
pnpm --filter @toban/discord-bot exec wrangler secret list --env base
```

投入が終わったら、生成した鍵ファイル（stamper と verifier）は**ローカルから削除**してください。

> ⚠️ **デプロイ前に `secret put` しないでください。** 対象 Worker がまだ存在しない場合、wrangler は
> 「その名前の Worker を作って secret を付けるか？」と聞き、**中身が
> `export default { fetch() {} }` だけ・bindings が全て空のプレースホルダ Worker を作成**します。
> しかもこの確認は**非対話環境では自動的に「はい」**に倒れる実装なので、worker 名を打ち間違えると
> 気づかないままゴミの Worker がアカウントに増えます。
> deploy を先に済ませておけば、この分岐自体に入りません。

---

## 7. OpenClaw（Discord エージェント / Fly.io）

Discord に常駐して会話し、15 分ごとに Goldsky を見て通知するエージェント。
構成の説明は [`pkgs/openclaw/README.md`](pkgs/openclaw/README.md)。

**Cloudflare Workers（§6）より後**にデプロイします。

### 7-0. MCP エンドポイント（Toban 側）

エージェントは `@toban/discord-bot` の `POST /mcp` 越しに Toban を触ります。**自前の
OpenClaw でも、コミュニティが既に動かしている OpenClaw でも同じ**です。

```bash
# HMAC 鍵（1 回だけ生成して使い回す）
openssl rand -base64 32 | pnpm --filter @toban/discord-bot exec wrangler secret put MCP_TOKEN_SECRET --env base

# サーバーごとにトークンを発行して、そのサーバーの運用者に渡す
MCP_TOKEN_SECRET='...' pnpm discord-bot mint-mcp-token <guildId>
```

トークンはギルド id を埋め込んだ HMAC なので、**他のサーバーの情報は取得できません**。
書き込みは必ず確認ボタン経由なので、トークン単体では資産は動きません。

> ⚠️ 失効は今のところ **`MCP_TOKEN_SECRET` のローテーション（＝全ギルド一括失効）**
> しかありません。個別失効が要るようになったら platform_links 側にバージョンを持たせます。

### 7-1. 初回のみ

**Discord Developer Portal** — 既存の Toban Bot と**同じアプリケーション・同じトークン**を
使います（Bot を 2 つ入れない）。

- Privileged Gateway Intents: **Message Content**（必須）と **Server Members**（許可リスト
  解決用）を有効化
- **Interactions Endpoint URL は discord-bot Worker のまま変えない。** OpenClaw は
  Gateway で interaction を受け取れませんが、それで正しい状態です

> ⚠️ **同じトークンで OpenClaw を 2 インスタンス起動しないでください。** 両方が Gateway に
> 接続し、同じメッセージに 2 回返信します。エージェントは Base 本番のみに置き、staging が
> 必要なときは別の Discord Application を作ります。

**Fly**

```bash
fly apps create tobanclaw
# ボリュームが無いまま deploy すると、設定と automations の状態が再起動のたびに消えます
fly volumes create openclaw_data --size 1 --region nrt --app tobanclaw
```

> ⚠️ **trial org ではデプロイできません。** リリース作成が 422 で拒否されます
> (`This functionality is disabled for trial organizations`)。クレジットカードの登録が要ります。

**secrets**

| 名前 | 用途 |
|---|---|
| `OPENCLAW_GATEWAY_TOKEN` | loopback 以外にバインドする場合に必須 |
| `ANTHROPIC_API_KEY` | エージェントのモデル |
| `DISCORD_BOT_TOKEN` | 既存の Toban Bot と**同じ**トークン |
| `TOBAN_MCP_TOKEN` | discord-bot Worker の MCP エンドポイントの認証 |

```bash
fly secrets set OPENCLAW_GATEWAY_TOKEN=... --app tobanclaw
```

LLM プロバイダの鍵は `ANTHROPIC_API_KEY` / `OPENROUTER_API_KEY` / `OPENAI_API_KEY` の
いずれか 1 つがあれば足ります。

設定ファイルには秘密を書きません。`${TOBAN_MCP_TOKEN}` のような参照が実行時に解決されます。

### 7-2. ギルド一覧

```bash
cp pkgs/openclaw/config/guilds.example.json pkgs/openclaw/config/guilds.json
```

`label` / `guildId` / `treeId` / `chainId` / `mcpUrl` / `allowUsers` を書きます。
**`allowUsers` を空にすると Bot が参加している全員に反応する**ため、レンダリング時に
弾かれます。

### 7-3. デプロイ

```bash
pnpm openclaw test                    # 設定レンダリングの検証
pnpm openclaw push:config --dry-run   # 設定が組み立つことを確認（送信しない）
pnpm openclaw deploy:fly              # 事前確認 → fly deploy
pnpm openclaw push:config             # /data/openclaw.json を送って再起動
```

**`fly deploy` は設定ファイルを入れ替えません。** 設定の実体はボリューム上の
`/data/openclaw.json` なので、変えたときは `push:config` を流します。`instructions/`
も同じく `push:config` で各ワークスペースへ `AGENTS.md` として送られます
（イメージには焼き込まれていません）。

`push:config` は送信後・再起動前にリモートで `openclaw config validate` を通し、
落ちたら退避した設定へ戻して中断します。**不正な設定のまま再起動すると gateway が
exit 78 で再起動ループに入り、10 回でマシンが停止して ssh も入れなくなります。**

テンプレートのキー名を本家のスキーマと突き合わせるとき:

```bash
fly console --app tobanclaw -C "openclaw config schema"
```

### 7-4. 詰まったとき

**不正な設定を置いてマシンが停止した場合**、gateway はボリューム上の設定を読んで即死する
ため、通常の起動では ssh が間に合いません。プロセスコマンドを一時的に差し替えて掃除します。

```bash
# 引数を無視するエントリポイントに差し替えて起動（--entrypoint は既存 cmd の前に置かれる
# ので、後続の引数を読み捨てる形にする必要があります）
fly machine update <machine-id> -a tobanclaw --entrypoint "/bin/sh -c 'exec sleep 900' --" --yes
fly machines start <machine-id> -a tobanclaw

# flyctl はヘルスチェックが通っていないマシンを選ばないので --machine で名指しする
fly ssh console -a tobanclaw --machine <machine-id> -C "rm -f /data/openclaw.json"

# 元に戻す
fly machine update <machine-id> -a tobanclaw --entrypoint "" --yes
```

### 7-5. 確認

```bash
fly status --app tobanclaw     # 1 台動いていて checks が passing
fly logs --app tobanclaw
fly ssh console --app tobanclaw -C "openclaw automations list"
# Discord で話しかけて応答すること、スラッシュコマンドが消えていないこと
```

ヘルスチェックは `/startupz` を見ていて、正常なら `{"ok":true,"status":"started"}` を返します。

---

## デプロイ後の確認

```bash
# コントラクト
pnpm contract test

# ABI 同期漏れが無いか
git diff --stat pkgs/frontend/abi/ pkgs/subgraph/abis/

# サブグラフ（hasIndexingErrors:false かつ block が伸びていること）
curl -s -X POST "<GOLDSKY_ENDPOINT>" -H "content-type: application/json" \
  -d '{"query":"{_meta{block{number} hasIndexingErrors} workspaces(first:3){id}}"}'

# フロントエンド
pnpm frontend typecheck && pnpm frontend build

# Worker のログを見ながら Discord でコマンドを実行
pnpm --filter @toban/discord-bot exec wrangler tail --env base --format pretty

# Turnkey（対象チェーンのポリシーがあること）
turnkey request --path /public/v1/query/list_policies -k "$TK_ADMIN_KEY" \
  --organization "$TK_ORG" --body "{\"organizationId\":\"$TK_ORG\"}" \
  | jq '.policies[] | {policyName, effect, condition}'

# 実際に /thx と /quest submit を 1 回ずつ通す
```

うまくいかないときは
[`deploy-base-production.md`](pkgs/extensions/discord-bot/docs/deploy-base-production.md)（症状 → 原因 → 対処）を参照してください。
