# Base 本番デプロイ手順 & つまづきポイント集

このドキュメントは、`@toban/discord-bot` + `@toban/identity` を **Base 本番**へ
デプロイした際の実践記録です。`README.md` / `docs/turnkey-setup.md` の汎用手順を
補完し、特に **一度ハマると分かりにくい落とし穴**をまとめています。

> **全レイヤーを通した手順は [`DEPLOYMENT.md`](../../../../DEPLOYMENT.md)（リポジトリ
> ルート）を先に読んでください。** このドキュメントはその「つまづきポイント集」です。

環境は **Sepolia = `wrangler.toml` の top-level 設定**（worker `toban-discord-bot`）、
**Base = `[env.base]`**（worker `toban-discord-bot-base`）で分離されています。本番は必ず
`deploy:base`（`--env base`）で操作してください。`[env.sepolia]` は存在しません
（top-level と重複するため削除済み）。

Sepolia と Base は **同一 Cloudflare アカウント**にあり、**worker 名と D1 で分離**されています
（`toban-discord-bot` / `toban-discord-bot-base`、`toban-identity` / `toban-identity-base`）。

---

## デプロイ順序（依存関係）

```
identity Worker → Turnkey → Discord Portal → bot Worker → Discord 配線 → frontend
```

bot は identity に service binding で依存するため **identity を先に**デプロイします。
各 Worker は環境ごとに別名（`toban-identity-base` / `toban-discord-bot-base`）で
デプロイされ、bot の service binding `IDENTITY` は `toban-identity-base` を指します。

### 確定済みの Base 値

| 項目 | 値 |
|---|---|
| `CHAIN_ID` | `8453` |
| Toban subgraph (`GOLDSKY_GRAPHQL_ENDPOINT`) | Goldsky `toban-base/0.0.1` |
| Hats subgraph (`HATS_GRAPHQL_ENDPOINT`) | **The Graph Gateway**（Studio は廃止。secret） |
| Base Hats subgraph id | `FWeAqrp36QYqv9gDWLwr7em8vtvPnPrmRRQgnBb6QbBs` |
| ENS 解決 (`MAINNET_RPC_URL`) | Ethereum mainnet RPC（Ankr 等） |

### secret として入れるもの（`wrangler secret put <NAME> --env base`）

bot: `DISCORD_APP_ID` / `DISCORD_PUBLIC_KEY` / `DISCORD_BOT_TOKEN` /
`DISCORD_CLIENT_SECRET` / `TURNKEY_API_PUBLIC_KEY` / `TURNKEY_API_PRIVATE_KEY` /
`VERIFIER_PRIVATE_KEY` / `INSTALL_STATE_SECRET` / `LOOKUP_READ_SECRET` /
`PLATFORM_LINK_WRITE_SECRET` / `RPC_URL` / `HATS_GRAPHQL_ENDPOINT`

identity: `DISCORD_BOT_VERIFIER_PUBLIC_KEY` / `RPC_URL` / `LOOKUP_READ_SECRET` /
`PLATFORM_LINK_WRITE_SECRET`

frontend: `.env.base` に `VITE_IDENTITY_WORKER_URL`（identity Worker の URL）。

---

## つまづきポイント集（症状 → 原因 → 対処）

### 1. secret にしたい値を `[vars]` に置くと効かない
**原因:** 同名のものが `[vars]`（平文）にあると、`wrangler deploy` 時に var が
secret を**上書き**する。
**対処:** secret 化する名前（`RPC_URL` / `HATS_GRAPHQL_ENDPOINT` など）は、その
環境の `vars` ブロックから**完全に削除**してから `wrangler secret put`。
top-level `[vars]` は named environment に**継承されない**（`wrangler deploy
--dry-run --env base` の `Vars:` 出力で実際に降りてくる値を確認できる）。

### 2. Discord slash コマンド登録が `403 / 50001 Missing Access`
**原因:** bot がそのギルドに `applications.commands` スコープで入っていない。
**対処:** **登録より先に**、`bot` + `applications.commands` 両スコープで招待する:
```
https://discord.com/api/oauth2/authorize?client_id=<APP_ID>&scope=bot%20applications.commands&permissions=2048
```
既に `bot` だけで招待済みなら、同 URL を再度開いて同じサーバーを再認可すれば
スコープが追加される。その後 `register-commands` を実行。

### 3. `/toban-setup` で `"pkcs8" must be PKCS#8 formatted string`
**原因:** `VERIFIER_PRIVATE_KEY` が SEC1 PEM（`-----BEGIN EC PRIVATE KEY-----`）。
`verifier.ts` は `importPKCS8` を使うため PKCS#8（`-----BEGIN PRIVATE KEY-----`）が必要。
`openssl ecparam -genkey` は SEC1 を出すので、これで作ると必ず踏みます。
**対処:** **最初から PKCS#8 で作る**（変換工程を無くす）:
```bash
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out verifier.key.pem
openssl pkey -in verifier.key.pem -pubout -out verifier.pub.pem   # identity 側は SPKI
head -1 verifier.key.pem verifier.pub.pem                          # 冒頭行を目視確認
```
既存の SEC1 鍵を活かすなら `openssl pkcs8 -topk8 -nocrypt -in old.pem -out new.pem`。
secret はファイルリダイレクト（`<`）で投入する（プロンプト貼り付けは改行が壊れる）。
→ [`turnkey-setup.md` §8](./turnkey-setup.md)

### 4. Turnkey に API public key を登録できない（非圧縮形式）
**原因:** Turnkey は P-256 の **compressed** 公開鍵（66hex、`02`/`03` 始まり）しか受けない。
openssl で素朴に出すと非圧縮になる。
**対処:** **openssl を使わない。** `turnkey generate api-key` が最初から圧縮形式で出力します:
```bash
turnkey generate api-key --organization "$TK_ORG" --key-name toban-discord-bot-base
cat ~/.config/turnkey/keys/toban-discord-bot-base.public   # 66hex, 03… 改行なし
```
（旧版はここで `openssl ec -pubout -conv_form compressed | tail -c 33 | xxd` という
変換を書いていましたが、CLI を使えば不要です）

### 5. Turnkey CLI 鍵の保存場所と `:p256` サフィックス
- 保存場所は **`~/.config/turnkey/keys/<key-name>.{public,private,meta}`**
  （`turnkey generate api-key` の出力 `privateKeyFile` が正）。
- `.private` の中身は **`<64桁hex>:p256`** 形式。bot の `importStamperKey` は
  「ちょうど64hex」か PKCS#8 しか受けないので、`:p256` を**除いて**投入:
  ```bash
  printf '%s' "$(cut -d: -f1 ~/.config/turnkey/keys/<name>.private)" \
    | pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PRIVATE_KEY --env base
  ```
- `.public`（66hex）は `TURNKEY_API_PUBLIC_KEY` にそのまま。
- 投入したら **stamper の秘密鍵はローカルから消す**（CLI 運用に要るのは管理用キーだけ）。

### 6. Turnkey の bot ユーザーは **non-root** にする
**原因:** root user は**ポリシーをバイパス**するため、stamper を root に載せると
mintFrom 限定が効かない。
**対処:** `Users → Add User`（API key）で専用ユーザーを作り、root quorum に
入れない。ポリシーでそのユーザーに許可を与える。

### 7. `/balance` で `401 unauthorized`
**原因:** `LOOKUP_READ_SECRET` / `PLATFORM_LINK_WRITE_SECRET` が bot と identity で
**不一致または未設定**（bot が `x-toban-lookup-secret` で送り、identity が照合）。
**対処:** 値を1回生成して**両 Worker に同じ値**を `--env base` で投入。

### 8. Hats subgraph: `deployment ... does not exist`
**原因:** Base の Hats Studio エンドポイントは**廃止**。
**対処:** The Graph **Gateway** を使う:
`https://gateway.thegraph.com/api/<KEY>/subgraphs/id/FWeAqrp36QYqv9gDWLwr7em8vtvPnPrmRRQgnBb6QbBs`

### 9. Hats subgraph: `auth error: API key not found`
**原因:** Gateway URL の API キーが無効/プレースホルダ残り/空白混入。
**対処:** `curl` で URL 単体を疎通確認してから `wrangler secret put`（`printf '%s'`
で改行を入れない）。

### 10. Hats subgraph: `auth error: domain not authorized by user`
**原因:** frontend の `VITE_THEGRAPH_API_KEY` は**ドメイン allowlist 付き**。
サーバー（bot）は Origin を持たないため弾かれる。
**対処:** The Graph Studio で **bot 用の別 API キー**を発行し、**Authorized
Domains を空**にする（任意で Authorized Subgraphs を Hats に限定）。frontend の
キーは流用しない。

### 11. `Could not resolve the workspace's ThanksToken ... Indexing may still be in progress`
**原因（多い順）:**
1. `GOLDSKY_GRAPHQL_ENDPOINT` が **toban-sepolia** を指していた（チェーン取り違え）。
2. ワークスペース作成直後で subgraph が未インデックス。
**対処:** live の `GOLDSKY_GRAPHQL_ENDPOINT` が **toban-base** か確認（ダッシュボード
or `deploy:base` の `Vars:` 出力）。subgraph を直接 `curl` して
`workspace(id:"<treeId>"){ thanksToken { id } }` が返るか確認。

### 12. `/thx` が無言（エラーメッセージすら返らない）
**原因:** followup の本文が Discord の **2000字上限**を超えて `400` で失敗。
verbose な viem/Turnkey エラーをそのまま本文に入れると即超過する。
**対処:** `sendFollowup` は2000字に切り詰め済み。`executeThx` の mintFrom catch は
全文を `console.error`（Workers Logs）に出し、Discord には viem の `shortMessage`
だけ返すよう修正済み。**`wrangler tail --env base` で実エラーを確認**するのが基本。

### 13. Turnkey policy `403 ... No policies evaluated to outcome: Allow`
原因は 3 つのどれかです。

**(a) raw_payload で署名していた（解決済み・再発させないこと）**
bot は当初 `sign_raw_payload`（生ハッシュ署名）を使っていましたが、ポリシーは
`ACTIVITY_TYPE_SIGN_TRANSACTION_V2` + `eth.tx.*` を条件にしていました。raw_payload では
Turnkey は**不透明な32バイトハッシュしか見えず**、`to`/selector/`value` で制限できません。
`signer/turnkey.ts` の `signTransaction` は **`sign_transaction`**（TEE が tx を解析）に
変更済みです。`signMessage` / `signTypedData` は今も raw_payload 経路なので、
ポリシーにより**意図的に拒否されます**（本番未使用）。

**(b) そのチェーン用のポリシーが無い**
ポリシーは `eth.tx.chain_id` を固定しています。**2026-07-26 時点で適用済みなのは
Base 用の 1 本だけで、Sepolia 用は存在しません。** bot ユーザーは non-root なので、
この状態では Sepolia の署名は必ず 403 になります。
→ `./turnkey/apply-policy.sh sepolia` で適用。

**(c) 条件式のどれかが外れている**
`chain_id` + `value` だけの最小ポリシーから始め、セレクタを 1 つずつ足すと切り分けられます。

適用中の Base ポリシー（`list_policies` で確認した実物）:
```
consensus: approvers.any(user, user.id == '<BOT_USER_ID>')
condition: activity.type == 'ACTIVITY_TYPE_SIGN_TRANSACTION_V2'
           && eth.tx.chain_id == 8453
           && eth.tx.value == 0
           && (eth.tx.data[0..10] == '0x40062e89' || eth.tx.data[0..10] == '0x947ec45f')
```

> **`eth.tx.to` を縛っていないのは意図的です。** ワークスペースごとに ThanksToken /
> HatsQuestModule のクローンが増えるため、正当な宛先は作成のたびに増えます。毎回
> `update_policy` が要るゲートは維持できないので、セレクタ・`value == 0`・`chain_id` に
> 効かせる方針です。したがって「`to` が違うから拒否された」は起こりません。
> 判断の根拠と残存リスクは `turnkey/policy.json` の `_decisions`、未対応項目は同 `_gaps` と
> [`turnkey-setup.md` §10](./turnkey-setup.md) を参照。

---

## デバッグの基本動作

- **Workers Logs を有効化**（`wrangler.toml` に `[observability]` / 各 env に
  `[env.<name>.observability]`、`enabled = true`）。
- **リアルタイム**: `wrangler tail --env base --format pretty` を起動した状態で
  Discord コマンドを実行 → `console.*` と未捕捉例外が流れる。`/thx` のような
  defer + followup 経路は、followup 失敗がここでしか見えない。
- secret は即反映（**再デプロイ不要**）。vars / コード変更は `deploy:base` が必要。

## セキュリティの注意

- bot の `RPC_URL` / `HATS_GRAPHQL_ENDPOINT` は API キーを含むため **secret**。
  `[vars]` に書かない（git にも残さない）。
- frontend の `VITE_*` キーは**ビルド時にクライアントへ埋め込まれ公開**される。
  The Graph / Alchemy キーは**ドメイン allowlist**で保護する（git の有無に依らず）。
- 過去に `[vars]` へコミットしてしまったキー（例: 旧 Sepolia Alchemy キー）は
  git 履歴に残るので**ローテーション**する。
- 生成した鍵ファイル（verifier / stamper の PEM）は secret 投入後に**ローカル削除**。
