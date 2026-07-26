# 鍵ローテーション runbook

本番に触る前に**全部読んでください**。操作は原則 CLI で行います
（セットアップと共通変数は [`turnkey-setup.md`](./turnkey-setup.md) §1）。

```bash
export TK_ORG=24cfae8c-aae0-4341-8492-295057f66bac
export TK_ADMIN_KEY=toban-turnkey-admin
```

## 対象の鍵

| 鍵 | 置き場所 | 漏洩時の被害 |
|---|---|---|
| bot 署名鍵（`mintFrom` / `submitCompletion`） | Turnkey TEE | 各ユーザーが `approveMint` した `mintAllowance` の範囲まで。取り消されるまで |
| Turnkey API stamper 鍵 | Workers Secret | 同上。ただし Turnkey ポリシーで 2 セレクタ・`value == 0`・単一チェーンに制限される |
| `VERIFIER_PRIVATE_KEY`（ES256） | Workers Secret | Discord↔ウォレット連携のなりすまし試行。on-chain の mint は起きない |

## 先に把握しておくべき依存関係

**適用中のポリシーは署名鍵アドレスを参照していません**（`eth.tx.from` の条件がありません）。
つまり **署名鍵を替えてもポリシーの書き換えは不要**です。署名鍵アドレスに依存しているのは
次の 2 つだけ:

1. `wrangler.toml` の `TURNKEY_BOT_SIGNER_ADDRESS` — **`[vars]` であって secret ではありません。**
   ファイルを編集して**再デプロイ**します（`wrangler secret put` ではありません）。
2. 各ユーザーが `approveMint(spender, value)` で承認した先。これは**オンチェーンの状態**なので、
   ユーザー自身に新アドレスへ承認し直してもらう以外に移す方法はありません。ここがローテーションの
   律速です。

## トリガー

以下のいずれかで**即時**ローテーション:

- いずれかの鍵の漏洩が疑われる（開発機の侵害、ログへの露出、誤コミット等）
- Turnkey org または Workers Secret にアクセスできるメンテナがチームを離れた
- Turnkey の activity log に想定外の形（2 セレクタ以外の呼び出し、署名試行の急増、
  ポリシー拒否の急増）が出た
- ThanksToken / HatsQuestModule がアップグレードされてセレクタが変わった
  （この場合 bot はそもそも署名できないので、コントラクト更新と同時にポリシーも更新する）

それ以外は定期的に:

- bot 署名鍵: 6 か月ごと
- stamper 鍵: 6 か月ごと（署名鍵と 3 か月ずらす）
- verifier 鍵: 12 か月ごと、または stamper と同時

---

## 計画的な署名鍵ローテーション

1. 同じ org 内に新しいウォレット / アカウントを作る（[`turnkey-setup.md`](./turnkey-setup.md) §5）。
   出てきたアドレスを `0xNEW` とします。

   ```bash
   turnkey wallets create --name "Toban Discord Bot Main v2" -k "$TK_ADMIN_KEY" --organization "$TK_ORG"
   turnkey wallets accounts create --wallet "Toban Discord Bot Main v2" \
     --address-format ADDRESS_FORMAT_ETHEREUM -k "$TK_ADMIN_KEY" --organization "$TK_ORG"
   ```

2. `0xNEW` に**ガス代を入れます**。ここを忘れると切り替えた瞬間に `/thx` が全部落ちます。

3. `wrangler.toml` の該当環境の `TURNKEY_BOT_SIGNER_ADDRESS` を `0xNEW` にする PR を出し、
   マージ後にデプロイ:

   ```bash
   pnpm --filter @toban/discord-bot deploy:base      # Sepolia は deploy:sepolia
   ```

   ポリシーは署名鍵を参照していないので、この時点で `0xNEW` は署名できます。
   一方 `0xOLD` も**まだ署名できる**状態です（誰も承認を移していないので実際には mint できません）。

4. `/<treeId>/discord-bot` のページから、`0xOLD` に残高のある承認を持つユーザーに
   `approveMint(0xNEW, value)`（必要なら `approveMint(0xOLD, 0)` で取り消し）への
   導線を出します。

5. bot から、連携済みの各ギルド（`platform_links`）にローテーションを告知します。

6. **Day +7**: `0xOLD` を DENY ポリシーで止めます（下記「旧署名鍵を止める」）。
   Worker はすでに `0xNEW` を使っているはずなので、ここは「何も起きない」ことの確認です。

7. **Day +14**: `0xOLD` のウォレットを削除するか、DENY ポリシーを恒久化します。

8. `docs/ops/rotation-log.md`（無ければ作る）に追記:

   ```md
   - 2026-MM-DD scheduled: 0xOLD -> 0xNEW by @maintainer.
     Migration rate at cutover: NN%.
   ```

### 旧署名鍵を止める

Turnkey のウォレットアカウントに「無効化」フラグはありません。確実なのは **DENY ポリシーを足す**
ことです。Turnkey は **DENY が ALLOW に優先**し、どのポリシーにも当たらない操作は暗黙で
DENY になります。

```bash
turnkey request --path /public/v1/submit/create_policy -k "$TK_ADMIN_KEY" --organization "$TK_ORG" \
  --body "$(jq -n --arg org "$TK_ORG" '{
    type:"ACTIVITY_TYPE_CREATE_POLICY_V3",
    timestampMs:(now*1000|floor|tostring),
    organizationId:$org,
    parameters:{
      policyName:"toban-discord-bot-deny-retired-signer-0xOLD",
      effect:"EFFECT_DENY",
      condition:"eth.tx.from == '0xOLD'",
      notes:"Retired signer. Remove only after the wallet is deleted."
    }}')"
```

（DENY は誰が要求しても落としたいので `consensus` は付けません。`condition` / `consensus` は
どちらも optional です。）

> ⚠️ **root ユーザーはポリシーを一切バイパスします。** DENY を入れても、root の credential で
> 署名すれば通ります。止めたつもりにならないよう、root の API キーの管理も併せて確認してください。

---

## 緊急時の署名鍵ローテーション

週単位ではなく時間単位に圧縮します。**順序が重要**です。

1. **先に漏れた鍵を止める。** 上記の DENY ポリシーを `0xOLD` に対して即座に適用します。
   これで `0xOLD` の署名要求は Turnkey で失敗し、ユーザーの資産は保全されます。
   bot が止まることは許容します。

2. `0xNEW` を作成 → ガスを入れる → `wrangler.toml` を更新 → `deploy:base`。目標 1 時間以内。

3. フロントのバナーと、連携済み全ギルド / 全 identity-bound ユーザーへの Discord 通知:
   - 「bot の署名鍵をローテーションしました。`/thx` は約 1 時間停止します」
   - 「`/<treeId>/discord-bot` から旧 signer の取り消し（`approveMint(0xOLD, 0)`）を強く推奨します」

4. 被害範囲の調査。**Turnkey の activity log が一次情報です**:

   ```bash
   turnkey activities list -k "$TK_ADMIN_KEY" --organization "$TK_ORG" \
     | jq '.activities[] | select(.type | test("SIGN")) | {id, type, status, createdAt}'
   ```

   > ⚠️ **subgraph では実行者を追えません。** `MintThanksToken` エンティティが持つのは
   > `from` / `to` / `amount` / `data` で、**`mintFrom` を実行した spender は記録されていません**。
   > オンチェーン側から追うなら、RPC で該当 ThanksToken のログを引き、各 tx の送信者が
   > `0xOLD` かどうかを見る必要があります。

5. `docs/incidents/<YYYY-MM-DD>.md` を作り、時系列 / 根本原因 / 被害範囲 / フォローアップを記録。

---

## stamper 鍵のローテーション（Workers Secret）

stamper はポリシーで縛られているため署名鍵より低リスクですが、手順の形は同じです。
オンチェーンの承認移行が無い分だけ単純になります。

1. 新しい stamper 鍵ペアを生成（[`turnkey-setup.md`](./turnkey-setup.md) §3）:

   ```bash
   turnkey generate api-key --organization "$TK_ORG" --key-name toban-discord-bot-base-v2
   ```

2. **既存の API キーは消さずに**、新しい公開鍵を bot ユーザーに追加します:

   ```bash
   turnkey request --path /public/v1/submit/create_api_keys -k "$TK_ADMIN_KEY" --organization "$TK_ORG" \
     --body "$(jq -n --arg org "$TK_ORG" \
       --arg pk "$(cat ~/.config/turnkey/keys/toban-discord-bot-base-v2.public)" '{
       type:"ACTIVITY_TYPE_CREATE_API_KEYS_V2",
       timestampMs:(now*1000|floor|tostring),
       organizationId:$org,
       parameters:{
         userId:"d84edada-715b-4e5b-b49e-da56669aac82",
         apiKeys:[{apiKeyName:"toban-discord-bot-v2", publicKey:$pk, curveType:"API_KEY_CURVE_P256"}]
       }}')"
   ```

3. Worker の secret を差し替えます（**再デプロイ不要・即反映**）:

   ```bash
   K=~/.config/turnkey/keys/toban-discord-bot-base-v2
   printf '%s' "$(cat $K.public)" \
     | pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PUBLIC_KEY --env base
   printf '%s' "$(cut -d: -f1 $K.private)" \
     | pnpm --filter @toban/discord-bot exec wrangler secret put TURNKEY_API_PRIVATE_KEY --env base
   ```

4. `/balance` と `/thx`（少額 1 件）で疎通確認。stamper 経路を通るのは `/thx` の方です。

5. 旧 API キーを削除:

   ```bash
   turnkey request --path /public/v1/query/list_users -k "$TK_ADMIN_KEY" --organization "$TK_ORG" \
     --body "{\"organizationId\":\"$TK_ORG\"}" \
     | jq '.users[] | select(.userId=="d84edada-715b-4e5b-b49e-da56669aac82") | .apiKeys'
   # 出てきた古い apiKeyId を指定して削除
   turnkey request --path /public/v1/submit/delete_api_keys -k "$TK_ADMIN_KEY" --organization "$TK_ORG" \
     --body "$(jq -n --arg org "$TK_ORG" '{
       type:"ACTIVITY_TYPE_DELETE_API_KEYS",
       timestampMs:(now*1000|floor|tostring),
       organizationId:$org,
       parameters:{userId:"d84edada-715b-4e5b-b49e-da56669aac82", apiKeyIds:["<old-api-key-id>"]}}')"
   ```

6. ローカルに残った鍵ファイルを削除します。

緊急時は順序を逆にします（先に削除 → 再発行 → secret 差し替え）。その間 bot は停止します。

---

## verifier 鍵のローテーション

1. 新しい ES256 鍵ペアを**最初から正しい形式で**生成（[`turnkey-setup.md`](./turnkey-setup.md) §8）:

   ```bash
   openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out verifier.key.pem
   openssl pkey -in verifier.key.pem -pubout -out verifier.pub.pem
   ```

2. identity Worker の `DISCORD_BOT_VERIFIER_PUBLIC_KEY` を新旧両方受け付ける状態にします。

   > ⚠️ **現在の実装は 1 本しか受け付けません。** `identity/src/verify.ts` の `verifyJwtES256` は
   > `importSPKI` に PEM を 1 つ渡すだけで、鍵の配列に対応していません。無停止で回すには
   > `extensions/identity` に複数鍵対応の issue を立てて先に実装する必要があります。
   > 実装しない場合は、下の手順 3 の瞬間に**発行済みトークンが即座に無効**になります
   > （TTL は 15 分なので、その間に `/toban-setup` を始めたユーザーはやり直しになります）。

3. bot の秘密鍵を差し替え（secret は即反映）:

   ```bash
   pnpm --filter @toban/discord-bot exec wrangler secret put VERIFIER_PRIVATE_KEY --env base < verifier.key.pem
   pnpm --filter @toban/identity    exec wrangler secret put DISCORD_BOT_VERIFIER_PUBLIC_KEY --env base < verifier.pub.pem
   ```

4. 複数鍵対応を入れた場合は、30 分後（`VERIFIER_TOKEN_TTL_SECONDS` = 15 分 + 余裕）に
   古い公開鍵を identity から外します。

5. 鍵ファイルをローカルから削除します。

---

## 今は割り切っていること

- **Turnkey activity log の自動監視。** 上の runbook は人間が異常に気づく前提です。
  想定形（2 セレクタ）から外れた activity を cron で diff して Discord に流す仕組みは未実装。
- **署名鍵の多重化。** Turnkey は閾値署名に対応していますが、bot は単一鍵で運用しています。
  流量が増えたら再検討。
- **Turnkey org 全体が侵害された場合の復旧。** 現実的な答えは
  「新しい org で作り直し、ユーザーに新アドレスへの再承認を依頼する」で、自動移行はありません。
- **verifier 鍵の無停止ローテーション。** 上記のとおり identity が複数鍵に未対応です。
