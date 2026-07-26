# `pkgs/extensions/` — Cloudflare Workers 共通事項

外部サービス連携の Worker 群です。ここには **2 つの Worker に共通する Cloudflare の作法**を
まとめます。各 Worker 固有の手順はそれぞれの README を見てください。

| パッケージ | 役割 |
|---|---|
| [`identity/`](identity/README.md) | アカウント ↔ ウォレット、ギルド ↔ ワークスペースの束縛を所有。D1 への書き込みはここだけ |
| [`discord-bot/`](discord-bot/README.md) | Discord のスラッシュコマンド。identity を service binding 経由で参照し、署名は Turnkey |

全レイヤーを通した実行順序は [`DEPLOYMENT.md`](../../DEPLOYMENT.md)（リポジトリルート）。

---

## 1. デプロイ順序は identity → discord-bot（必須）

bot は `IDENTITY` service binding で identity Worker を**名前で**参照します。identity が
未デプロイのまま bot を deploy すると失敗します:

```
✘ Service binding 'IDENTITY' references Worker 'toban-identity-base'
  which was not found. [code: 10143]
```

## 2. 環境の分離のしかた

**Sepolia と Base は同一 Cloudflare アカウント**にあり、**worker 名と D1 で**分離されています
（アカウントでは分けていません）。

| | Sepolia（staging） | Base（production） |
|---|---|---|
| wrangler 設定 | **top-level**（`[env.sepolia]` は存在しない） | `[env.base]` |
| デプロイ | `deploy:sepolia` | `deploy:base`（`--env base`） |
| Worker（identity） | `toban-identity` | `toban-identity-base` |
| Worker（bot） | `toban-discord-bot` | `toban-discord-bot-base` |
| D1 | `toban-identity` | `toban-identity-base` |

> **Sepolia は「top-level 設定」がそのままデプロイ対象**です。`wrangler dev` の既定でもあります。
> `[env.sepolia]` を足すと top-level と二重になるので、意図的に置いていません。

**D1 を分けている理由**: `platform_links` は guild → treeId を持ち、treeId はチェーン固有です。
共有すると Sepolia のテストデータが Base 本番に混ざります。

> ⚠️ **`pnpm --filter <pkg> deploy` は使えません。** `deploy` は pnpm のビルトインと衝突して
> `ERR_PNPM_INVALID_DEPLOY_TARGET` になります。必ず `deploy:sepolia` / `deploy:base` を。

## 3. `vars` と `secret` の関係（事故が多い）

- **同名の値が `[vars]`（平文）にあると、deploy 時に var が secret を上書きします。**
  secret にしたい名前（`RPC_URL` / `HATS_GRAPHQL_ENDPOINT` など）は、その環境の `vars` ブロックから
  **完全に削除**してから `wrangler secret put` してください。
- **top-level の `[vars]` は named environment に継承されません。** `[env.base]` は
  `vars` / `d1_databases` / `services` を全部書き直す必要があります。実際に降りてくる値は
  `wrangler deploy --dry-run --env base` の `Vars:` 出力で確認できます。
- **secret は投入即反映（再デプロイ不要）**。`vars` とコード変更は再デプロイが必要です。

### ⚠️ 無視してよい警告（直すと壊れる）

`deploy:base` で必ず出ます:

```
"vars.HATS_GRAPHQL_ENDPOINT" exists at the top level, but not on "env.base.vars".
```

**意図どおりです。** Base の Hats エンドポイントは The Graph Gateway の URL で API キーを含むため
secret として投入しています。警告に従って `[env.base.vars]` に追記すると、**平文の var が secret を
上書きして壊れます**。

## 4. Secrets

secret は **Worker 名ごと**にスコープされます。環境ごとに投入してください（`--env` 無し = Sepolia）。

| Worker | secret |
|---|---|
| identity | `DISCORD_BOT_VERIFIER_PUBLIC_KEY` / `RPC_URL` / `LOOKUP_READ_SECRET` / `PLATFORM_LINK_WRITE_SECRET` |
| discord-bot | `DISCORD_APP_ID` / `DISCORD_PUBLIC_KEY` / `DISCORD_BOT_TOKEN` / `DISCORD_CLIENT_SECRET` / `TURNKEY_API_PUBLIC_KEY` / `TURNKEY_API_PRIVATE_KEY` / `VERIFIER_PRIVATE_KEY` / `INSTALL_STATE_SECRET` / `LOOKUP_READ_SECRET` / `PLATFORM_LINK_WRITE_SECRET` / `RPC_URL` /（Base のみ）`HATS_GRAPHQL_ENDPOINT` |

**共有シークレット** — `LOOKUP_READ_SECRET` と `PLATFORM_LINK_WRITE_SECRET` は
**2 つの Worker で同じ値**にしてください。ずれると `/balance` などが 401 になります。

改行が混ざると壊れるので、プロンプトに貼らず `printf` かファイルリダイレクトで流し込みます:

```bash
printf '%s' "$VALUE" | pnpm --filter @toban/discord-bot exec wrangler secret put NAME --env base
pnpm --filter @toban/identity exec wrangler secret put NAME --env base < key.pem   # 複数行 PEM
```

## 5. エラー: 症状 → 原因

| 症状 | 原因 |
|---|---|
| `Service binding 'IDENTITY' references Worker '…' which was not found [10143]` | identity Worker が未デプロイ。identity → bot の順で deploy する（§1） |
| `D1 binding 'DB' references database '<id>' which was not found [10181]` | その D1 がこのアカウントに無い。エラー URL 中の `/accounts/<id>/` が意図したアカウントか確認。新環境なら `wrangler d1 create <name>` して `database_id` を更新 |
| `Authentication error [10000]` | wrangler が別アカウントを見に行っている。`wrangler whoami` で確認 |
| `ERR_PNPM_INVALID_DEPLOY_TARGET` | `pnpm --filter X deploy` を使っている（§2） |

> ⚠️ **`CLOUDFLARE_ACCOUNT_ID` を export したまま放置しないこと。** wrangler がそのアカウントに
> 固定され、別アカウントを触るときに 10181 / 10143 を踏みます。使ったら `unset` する。

その他の症状別の対処は
[`discord-bot/docs/deploy-base-production.md`](discord-bot/docs/deploy-base-production.md) に
まとまっています。

## 6. デバッグ

```bash
pnpm --filter @toban/discord-bot exec wrangler tail --env base --format pretty
```

を起動した状態で Discord コマンドを実行すると、`console.*` と未捕捉例外が流れます。
`/thx` のような defer + followup の経路は、followup の失敗がここでしか見えません。
Workers Logs は `wrangler.toml` の `[observability]` で有効化済みです
（**named environment に継承されない**ので `[env.base.observability]` にも書いてあります）。
