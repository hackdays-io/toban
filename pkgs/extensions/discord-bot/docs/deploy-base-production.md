# Base 本番デプロイ手順 & つまづきポイント集

このドキュメントは、`@toban/discord-bot` + `@toban/identity` を **Base 本番**へ
デプロイした際の実践記録です。`README.md` / `docs/turnkey-setup.md` の汎用手順を
補完し、特に **一度ハマると分かりにくい落とし穴**をまとめています。

環境は `wrangler.toml` の `[env.sepolia]` / `[env.base]` で分離されています。本番は
必ず `--env base`（`deploy:base` 等）で操作してください。

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
`verifier.ts` は `importPKCS8` を使うため PKCS#8 が必要。
**対処:**
```bash
openssl pkcs8 -topk8 -nocrypt -in verifier.key.pem -out verifier.pkcs8.pem
wrangler secret put VERIFIER_PRIVATE_KEY --env base < verifier.pkcs8.pem
```
secret はファイルリダイレクト（`<`）で投入する（プロンプト貼り付けは改行が壊れる）。

### 4. Turnkey の API user 作成で「Create」が押せない
**原因:** API public key が**非圧縮**形式。Turnkey は P-256 **compressed**（66hex、
`02`/`03` 始まり）を要求する。
**対処:** `-conv_form compressed` を付ける:
```bash
openssl ec -in key.pem -pubout -outform DER -conv_form compressed 2>/dev/null \
  | tail -c 33 | xxd -p -c 66
```
（`-conv_form` 無しで `tail -c 33` するとゴミになる）

### 5. Turnkey CLI 鍵の保存場所と形式
- 保存場所は **`~/.config/turnkey/keys/<key-name>.private`**（README の
  `~/.local/share/...` はバージョン差。`turnkey generate api-key` の出力
  `privateKeyFile` が正）。
- `.private` の中身は **`<64桁hex>:p256`** 形式。bot の `importStamperKey` は
  「ちょうど64hex」か PKCS#8 しか受けないので、`:p256` を**除いて**投入:
  ```bash
  printf '%s' "$(cut -d: -f1 ~/.config/turnkey/keys/<name>.private)" \
    | wrangler secret put TURNKEY_API_PRIVATE_KEY --env base
  ```
- `.public`（66hex）は `TURNKEY_API_PUBLIC_KEY` にそのまま。

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
**原因:** bot は当初 `sign_raw_payload`（生ハッシュ署名）を使っていたが、ポリシーは
`ACTIVITY_TYPE_SIGN_TRANSACTION_V2` + `eth.tx.*` を条件にしていた。raw_payload では
Turnkey は**不透明な32バイトハッシュしか見えず**、`to`/selector/`value` で制限不可。
**対処（採用）:** `signer/turnkey.ts` の `signTransaction` を **`sign_transaction`**
（TEE が tx を解析）に変更。ポリシーは下記:
```json
{
  "effect": "EFFECT_ALLOW",
  "consensus": "approvers.any(user, user.id == '<BOT_USER_ID>')",
  "condition": "activity.type == 'ACTIVITY_TYPE_SIGN_TRANSACTION_V2' && eth.tx.chain_id == 8453 && eth.tx.to == '<THANKSTOKEN_ADDRESS(lowercase)>' && eth.tx.data[0..10] == '0x40062e89' && eth.tx.value == 0"
}
```
これで stamper 漏洩時も TEE が mintFrom(value=0, to=ThanksToken, Base) 以外を拒否。
`signMessage`/`signTypedData`（raw_payload）は本番未使用で、このポリシーにより
意図的に拒否される。複数 ThanksToken なら `eth.tx.to in ['0x...', ...]`。
ポリシー式でハマったら `to`+`chain_id`+`value` から始めて段階的に selector を追加。

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
