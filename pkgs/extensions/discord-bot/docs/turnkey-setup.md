# Turnkey セットアップ（CLI 運用）

bot の Ethereum 署名鍵は Turnkey の TEE（AWS Nitro Enclave）内にあります。Worker が持つのは
**API stamper の鍵ペアだけ**で、Turnkey の policy engine が署名できる操作を 2 つの関数セレクタに
限定しています。

> **方針: Turnkey の操作はすべて CLI で行う。**
> ダッシュボードで触ってよいのは **org の初回作成と root ユーザーの passkey 登録だけ**です
> （API を叩くための最初の credential が無い状態なので、ここだけは GUI が必要）。
> それ以降を GUI でやると `turnkey/policy.json` と実態が静かにずれます。実際、このドキュメントの
> 旧版は GUI 前提で書かれていて、**org 構成・鍵の形式・ポリシー文法のすべてが実態と違っていました**。
>
> 全レイヤーのデプロイ順序は [`DEPLOYMENT.md`](../../../../DEPLOYMENT.md)（リポジトリルート）、
> 詰まったときの症状別対処は
> [`deploy-base-production.md`](./deploy-base-production.md) を参照。

---

## 0. 現在の構成（2026-07-26 時点 / CLI の `list_*` で実機確認）

**org は 1 つだけです。** Sepolia と Base で sub-org は分けていません。分離しているのは
**署名鍵（ウォレット）とポリシー**で、ポリシーは `eth.tx.chain_id` を固定しているため、
Base のポリシーで Sepolia の署名を通すことはできません。

| 項目 | 値 |
|---|---|
| Organization | `Toban` / `24cfae8c-aae0-4341-8492-295057f66bac` |
| Root user | `Root user` / `f3ba9a88-9fbc-49a3-84dc-c048c5bf4b52`（root quorum は threshold 1・このユーザーのみ） |
| Bot user（**non-root**） | `Toban Discord Bot` / `d84edada-715b-4e5b-b49e-da56669aac82` |
| Base 署名鍵 | `0xE21E99d384409e119cee731D368359BDc719a5f0`（wallet `Toban Discord Bot Main`, `m/44'/60'/0'/0/0`） |
| Sepolia 署名鍵 | `0xae4E13De7C14Dff7ff296De69cADf3A7F5208461`（wallet `Toban Dev`, `m/44'/60'/0'/0/0`） |
| ポリシー | Base 用 1 本のみ（`f37e6551-2ef0-4436-927c-8b251cb8303d`）。**Sepolia 用は未適用** — §9 参照 |

org id と署名鍵アドレスは `wrangler.toml` の `[vars]` にも入っています（**secret ではありません**）。
両者がずれると `TURNKEY_BOT_SIGNER_ADDRESS` で署名しようとして Turnkey が 404 を返します。

---

## 1. CLI の導入と共通変数

```bash
brew install tkhq/tap/turnkey     # 他の入れ方は https://github.com/tkhq/tkcli
turnkey version
```

以降のコマンドで使う変数:

```bash
export TK_ORG=24cfae8c-aae0-4341-8492-295057f66bac
export TK_ADMIN_KEY=toban-turnkey-admin   # §2 で作る管理用 API キーの名前
```

CLI の鍵は **`~/.config/turnkey/keys/<key-name>.{public,private,meta}`** に置かれます
（`--keys-folder` で変更可）。`-k/--key-name` でどの鍵で署名するかを選びます。

### 汎用リクエストヘルパ

CLI には `policy` / `users` サブコマンドがありません。それらは `turnkey request` で
API を直接叩きます。`timestampMs` は毎回現在時刻である必要があるため、body は都度組み立てます。

```bash
# tkreq <api-path> <ACTIVITY_TYPE> <parameters-json>
tkreq() {
  turnkey request --path "$1" -k "$TK_ADMIN_KEY" --organization "$TK_ORG" \
    --body "$(jq -n --arg t "$2" --arg org "$TK_ORG" --argjson p "$3" \
      '{type:$t, timestampMs:(now*1000|floor|tostring), organizationId:$org, parameters:$p}')"
}
```

読み取り系（`/public/v1/query/...`）は `parameters` を取らず、body が `{"organizationId": …}` だけです:

```bash
tkq() { turnkey request --path "$1" -k "$TK_ADMIN_KEY" --organization "$TK_ORG" \
          --body "{\"organizationId\":\"$TK_ORG\"}"; }

tkq /public/v1/query/list_policies
tkq /public/v1/query/list_users
tkq /public/v1/query/get_organization
```

---

## 2. 管理用 API キー（root ユーザーに紐づける）

CLI で org を操作するには root 権限の API キーが要ります。**bot の stamper キーを流用しないでください**
— bot キーは non-root なのでポリシー適用ができませんし、逆に管理権限を与えると §4 の分離が無意味になります。

> 現 org には root ユーザーに `Toban Dev` という名前の API キーが既にあります。手元にその秘密鍵が
> あるならそれを `$TK_ADMIN_KEY` に使えます（`-k` に渡すのは `~/.config/turnkey/keys/` 上の
> **ファイル名**であって、Turnkey 側の表示名ではありません）。無ければ以下で新規発行します。

```bash
turnkey generate api-key --organization "$TK_ORG" --key-name "$TK_ADMIN_KEY"
cat ~/.config/turnkey/keys/$TK_ADMIN_KEY.public   # 66 文字の圧縮 P-256 公開鍵
```

この公開鍵を root ユーザーに登録します。**初回だけは**手元に有効な credential が無いため、
ダッシュボードの root ユーザー画面から公開鍵を貼って登録してください。2 本目以降は CLI で足せます:

```bash
tkreq /public/v1/submit/create_api_keys ACTIVITY_TYPE_CREATE_API_KEYS_V2 "$(jq -n \
  --arg pk "$(cat ~/.config/turnkey/keys/$TK_ADMIN_KEY.public)" \
  '{userId:"f3ba9a88-9fbc-49a3-84dc-c048c5bf4b52",
    apiKeys:[{apiKeyName:"toban-turnkey-admin", publicKey:$pk, curveType:"API_KEY_CURVE_P256"}]}')"
```

---

## 3. bot の stamper 鍵を発行する（**形式変換は不要**）

```bash
turnkey generate api-key --organization "$TK_ORG" --key-name toban-discord-bot-base
```

生成されるファイルと形式（実機確認済み）:

| ファイル | 形式 | 用途 |
|---|---|---|
| `<name>.public` | **圧縮 P-256 公開鍵**・66 hex（`02`/`03` 始まり）・改行なし | Turnkey に登録 / `TURNKEY_API_PUBLIC_KEY` |
| `<name>.private` | `<64桁hex>:p256` | `:p256` を落として `TURNKEY_API_PRIVATE_KEY` |
| `<name>.meta` | `{name, organizations[], public_key, scheme}` | 参照用 |

> **openssl は使いません。** 旧版は `openssl ecparam` で生成して `-conv_form compressed` で
> 圧縮し直す手順でしたが、Turnkey は圧縮形式しか受け付けないため、非圧縮で作ると登録画面で
> 弾かれます。`turnkey generate api-key` は**最初から圧縮形式で出力する**ので、変換工程ごと
> 消えます。

Worker への投入（`.private` の `:p256` サフィックスだけ落とす）:

```bash
K=~/.config/turnkey/keys/toban-discord-bot-base

printf '%s' "$(cat $K.public)" \
  | pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PUBLIC_KEY --env base

printf '%s' "$(cut -d: -f1 $K.private)" \
  | pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PRIVATE_KEY --env base
```

`src/signer/turnkey.ts` の `importStamperKey` が受け付けるのは **ちょうど 64 hex** か
**PKCS#8 PEM** だけです。`:p256` が付いたままだとどちらにも当たらず、`/thx` が署名時に落ちます。

投入後、**Worker で使う stamper の秘密鍵はローカルから消してください**:

```bash
rm -f $K.private $K.public $K.meta
```

管理用キー（`$TK_ADMIN_KEY`）は CLI 運用に必要なので手元に残します。

---

## 4. bot ユーザーを作る（**必ず non-root**）

**root ユーザーはポリシーをバイパスします。** stamper を root に載せると、この後のセレクタ制限が
一切効きません。bot 専用の API-only ユーザーを作り、root quorum には入れないでください。

```bash
tkreq /public/v1/submit/create_users ACTIVITY_TYPE_CREATE_USERS_V4 "$(jq -n \
  --arg pk "$(cat ~/.config/turnkey/keys/toban-discord-bot-base.public)" \
  '{users:[{
      userName:"Toban Discord Bot",
      apiKeys:[{apiKeyName:"toban-discord-bot", publicKey:$pk, curveType:"API_KEY_CURVE_P256"}],
      authenticators:[], oauthProviders:[], userTags:[]
   }]}')"
```

返ってきた `userId` を控えます。これが `turnkey/policy.json` の `consensus` に入る値です。
後から引くには:

```bash
tkq /public/v1/query/list_users | jq -r '.users[] | "\(.userId)\t\(.userName)"'
```

root quorum に入っていないことの確認:

```bash
tkq /public/v1/query/get_organization | jq '.organizationData.rootQuorum'
```

---

## 5. 署名ウォレットを作る

```bash
turnkey wallets create --name "Toban Discord Bot Main" -k "$TK_ADMIN_KEY" --organization "$TK_ORG"

turnkey wallets accounts create --wallet "Toban Discord Bot Main" \
  --address-format ADDRESS_FORMAT_ETHEREUM -k "$TK_ADMIN_KEY" --organization "$TK_ORG"

turnkey wallets accounts list --wallet "Toban Discord Bot Main" \
  -k "$TK_ADMIN_KEY" --organization "$TK_ORG" | jq -r '.accounts[] | "\(.address)\t\(.path)"'
```

- 出てきたアドレスを `wrangler.toml` の該当環境の `TURNKEY_BOT_SIGNER_ADDRESS` に入れます（var）。
- **`turnkey wallets export` は実行しないでください。** 秘密鍵を TEE の外に出す意味がありません。
  鍵を替えるときは [`key-rotation.md`](./key-rotation.md) の手順で入れ替えます。
- このアドレスは自分でガス代を払います。デプロイ先チェーンで残高を持たせてください
  （Base なら数 mETH で十分。`/thx` 1 回あたりのガスは微小です）。

---

## 6. ポリシーを適用する

`turnkey/policy.json` が**唯一の正**です。`policies[].parameters` は
`create_policy` にそのまま渡せる本物のリクエストパラメータで、プレースホルダはありません。

**同梱の冪等スクリプトを使ってください。**

```bash
cd pkgs/extensions/discord-bot

./turnkey/apply-policy.sh base --dry-run    # 送信内容と create/update の別を確認（何も送らない）
./turnkey/apply-policy.sh base              # 適用
./turnkey/apply-policy.sh sepolia
```

スクリプトは `policy.json` の `policyId` を見て、既存があれば `update_policy`、
`null` なら `create_policy` を選びます。**新しく作ったら、返ってきた `policyId` を
`policy.json` に書き戻してください。**

手で叩くより確実なのは、この 3 点をまとめて外せないからです:

- `create_policy` は**毎回新しいポリシーを増やします**。書き換えのつもりで `create` を叩くと、
  古い（たいてい緩い）ポリシーが残ったまま許可が二重になります。
- `create` と `update` で**フィールド名が違います**（`condition` → `policyCondition` など）。
- ポリシー名で照合すると、`policy.json` で改名した瞬間に既存を取り逃して重複を作ります。
  だから `policyId` で引きます。

どうしても手で叩く場合:

```bash
# 新規
tkreq /public/v1/submit/create_policy ACTIVITY_TYPE_CREATE_POLICY_V3 \
  "$(jq -c '.policies[]|select(.id=="base")|.parameters' turnkey/policy.json)"

# 既存の書き換え（フィールド名が変わる）
tkreq /public/v1/submit/update_policy ACTIVITY_TYPE_UPDATE_POLICY_V2 "$(jq -c \
  '.policies[]|select(.id=="base")
   | {policyId} + (.parameters
     | {policyName, policyEffect:.effect, policyCondition:.condition,
        policyConsensus:.consensus, policyNotes:.notes})' turnkey/policy.json)"
```

### ポリシー文法で使えるもの / 使えないもの

Turnkey のポリシー言語は限定的です。旧版の `policy.json` は**存在しない構文**で書かれていて
適用できませんでした。

| 使える | 使えない（旧版が誤用していたもの） |
|---|---|
| `eth.tx.{to,from,value,chain_id,nonce,data,function_name,contract_call_args}` | `eth.tx.data.selector` / `eth.tx.data.args[0]` |
| セレクタは `eth.tx.data[0..10] == '0x40062e89'` | — |
| リスト判定 `x in ['0x…','0x…']` / `.contains()` | `tag('toban-thanks-token-registry')`（**`tag()` 関数は無い**） |
| `consensus` は `approvers.any(user, user.id == '<userId>')` | `consensus` 内での `user.tags.contains(...)`（tag は condition 側でしか参照できない） |
| — | `rate(...)`（レート制限のプリミティブは無い） |

ABI を org にアップロードすると `eth.tx.contract_call_args['<引数名>']` で引数を名前で
参照できます。現状は未アップロードのため、引数チェックは効いていません（§9）。

---

## 7. Worker secrets

secret は **Worker 名ごと**にスコープされるので、環境ごとに投入します（`--env` 無し = Sepolia）。
**secret は投入即反映で、再デプロイ不要**です。

**discord-bot**: `DISCORD_APP_ID` / `DISCORD_PUBLIC_KEY` / `DISCORD_BOT_TOKEN` /
`DISCORD_CLIENT_SECRET` / `TURNKEY_API_PUBLIC_KEY` / `TURNKEY_API_PRIVATE_KEY` /
`VERIFIER_PRIVATE_KEY` / `INSTALL_STATE_SECRET` / `LOOKUP_READ_SECRET` /
`PLATFORM_LINK_WRITE_SECRET` / `RPC_URL` /（Base のみ）`HATS_GRAPHQL_ENDPOINT`

**identity**: `DISCORD_BOT_VERIFIER_PUBLIC_KEY` / `RPC_URL` / `LOOKUP_READ_SECRET` /
`PLATFORM_LINK_WRITE_SECRET`

`LOOKUP_READ_SECRET` と `PLATFORM_LINK_WRITE_SECRET` は **2 つの Worker で同じ値**にします。
ずれると `/balance` が 401 になります。

改行が混ざると壊れるので、プロンプトに貼らず `printf` かファイルリダイレクトで流し込みます:

```bash
printf '%s' "$VALUE" | pnpm --filter @toban/discord-bot exec wrangler secret put NAME --env base
```

---

## 8. verifier 鍵（Turnkey 外・ES256）

`/toban-setup` が発行する verifier_token の署名鍵です。Turnkey ではなく Workers Secret に
置いています。漏洩時の被害は「Discord→ウォレット連携の試行をなりすませる」までで、
identity 側の EIP-712 ウォレット署名で頭打ちになります。

bot 側は `importPKCS8`、identity 側は `importSPKI` を使うので、**最初からその形式で生成**します
（変換工程はありません）:

```bash
# 秘密鍵: PKCS#8（"-----BEGIN PRIVATE KEY-----" で始まる）
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out verifier.key.pem

# 公開鍵: SPKI（"-----BEGIN PUBLIC KEY-----" で始まる）
openssl pkey -in verifier.key.pem -pubout -out verifier.pub.pem

head -1 verifier.key.pem verifier.pub.pem   # 冒頭行を必ず目視確認
```

> `openssl ecparam -genkey` は **SEC1**（`-----BEGIN EC PRIVATE KEY-----`）を出力します。
> これを入れると `/toban-setup` が `"pkcs8" must be PKCS#8 formatted string` で落ちます。
> `genpkey` なら最初から PKCS#8 なので、`openssl pkcs8 -topk8` での変換は不要です。

投入（PEM は複数行なのでファイルリダイレクトで）:

```bash
pnpm --filter @toban/discord-bot exec wrangler secret put VERIFIER_PRIVATE_KEY --env base < verifier.key.pem
pnpm --filter @toban/identity    exec wrangler secret put DISCORD_BOT_VERIFIER_PUBLIC_KEY --env base < verifier.pub.pem

rm -f verifier.key.pem verifier.pub.pem     # 投入後はローカルから削除
```

---

## 9. 検証

```bash
# 1. ポリシーが意図どおりか
tkq /public/v1/query/list_policies | jq '.policies[] | {policyName, effect, condition, consensus}'

# 2. bot ユーザーが root quorum の外か
tkq /public/v1/query/get_organization | jq '.organizationData.rootQuorum'

# 3. Worker のログを見ながら Discord で実行
pnpm --filter @toban/discord-bot exec wrangler tail --env base --format pretty
#    /balance      → identity 解決 + on-chain read（Turnkey を触らない＝Workers 設定の切り分け）
#    /thx          → Turnkey → 署名 → broadcast の全経路
#    /quest submit → もう 1 本のセレクタ
```

ポリシー拒否は `403 ... No policies evaluated to outcome: Allow` として `wrangler tail` に出ます。
条件式でハマったら `chain_id` + `value` だけの最小ポリシーから始めて、セレクタを足していくと
どの項が落としているか切り分けられます。

---

## 10. 既知のギャップ（2026-07-26 時点）

実機確認で見つかった、**ドキュメントの記述より実際の防御が弱い**点です。
詳細と対処案は `turnkey/policy.json` の `_gaps` に書いてあります。

1. **Sepolia 用ポリシーが存在しません。** 適用済みは Base 用（`chain_id == 8453`）1 本だけです。
   bot ユーザーは non-root なので、この状態では Sepolia の署名は必ず拒否されます。
   もし Sepolia で `/thx` が通っているなら、Sepolia Worker の `TURNKEY_API_*` が
   **root ユーザーの鍵**になっている＝ポリシーを丸ごとバイパスしています。
   どちらかを確認したうえで、`./turnkey/apply-policy.sh sepolia` を適用し、Sepolia の
   stamper を bot ユーザーの鍵に差し替えてください。
   **適用には root ユーザーの API キー**（`$TK_ADMIN_KEY`）が要ります。bot 自身の stamper で
   実行すると設計どおり 403 になります（bot は non-root で `sign_transaction` しか許可が無い）。
   なお Sepolia Worker は `RPC_URL` / `LOOKUP_READ_SECRET` / `PLATFORM_LINK_WRITE_SECRET` も
   未設定なので、ポリシー以前に稼働状態にありません。
2. **引数チェックが効いていません。** 両関数とも第 1 引数が「代行される本人」ですが、
   TEE 側では検証していません（bot が identity Worker で解決しているだけ）。
   ABI をアップロードすれば `eth.tx.contract_call_args` で検証できます。
3. **レート制限がありません。** Turnkey 側にプリミティブが無いため、必要なら Worker 側で実装します。

### `eth.tx.to` を縛らないのは意図的です（ギャップではありません）

ワークスペースごとに ThanksToken / HatsQuestModule のクローンが増えるため、正当な宛先の集合は
**ワークスペースが作られるたびに増えます**。`to` を固定すると作成のたびに `update_policy` が必要になり、
Turnkey には外部で管理するアドレス集合を参照する仕組み（`tag()` のようなもの）もありません。
毎回更新が要るゲートは、たいていの時間で間違っているゲートです。よってセレクタ・`value == 0`・
`chain_id` に効かせる方針を採っています。

残るリスクは「stamper が漏れた場合、同一チェーン上の任意コントラクトに 2 つのセレクタを投げられる」
ことです。その範囲を縛っているのは、`value == 0`（ガス残高の枯渇を防ぐ）、実装のないコントラクトでは
revert すること、実際の ThanksToken では各ユーザーが承認した `mintAllowance` が上限になること、の 3 点です。
将来見直すなら、チェーンごとに 1 つの Toban ルーターコントラクトを噛ませて `to` をそこに固定するのが
最も安価です。
