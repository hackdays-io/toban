# MCP サーバーを `@toban/discord-bot` から切り出す（設計）

対象は `pkgs/extensions/discord-bot/src/mcp/` にある `POST /mcp`。これを
`pkgs/extensions/mcp`（`@toban/mcp`）へ移し、Discord を**確認チャネルのアダプタ**という
位置に下げる。

この文書は実装前の設計合意用。実装したらこの内容は `pkgs/extensions/mcp/CLAUDE.md` と
`DEPLOYMENT.md` へ移し、このファイルは消す。

## 1. なぜ分けるか

**Discord は拡張機能であり、無くても Toban は使えるべき**という前提に対して、今の構成は
逆になっている。MCP エンドポイントが Discord bot Worker の中の 1 経路なので、

- トークンの引数が `guildId`
- 発行の前提が「Toban Bot 導入済み＋`/toban-link` 済み」
- 配布経路が「Discord サーバーの運用者に渡す」

と、**MCP を使うために Discord が必須**になっている。

加えてコード量の実態が変わった。#582 で read ツールが 3 → 7 本、`queries.ts` が約 600 行に
なり、そのすべてが Discord 非依存。Discord に縛られているのは `confirm.ts` /
`button.ts` / `discord-rest.ts` と `proposeTool` だけで、少数派になった。

### 一度却下した理由と、それが誤っていた点

「propose の前半と後半が別パッケージに割れ、`performThx` が唯一の経路である invariant が
パッケージ境界をまたぐ約束になる」——これは**分割の仕方をひとつしか想定していなかった**。

割れるのは「MCP パッケージが `buildConfirmMessage` を呼ぶ」形にした場合だけ。
`proposeTool` の中身を discord-bot 側に残し、**内部エンドポイント越しに依頼する**形なら
何も割れない。`ConfirmPayload` を作る側と読む側が同じパッケージに残るので、型の共有も
維持される。

## 2. トークンが守るもの

分割後もトークンは必要。守っているものを明示しておく（実装時の判断基準になる）。

| # | 仕事 | 分割後 |
|---|---|---|
| 1 | subgraph データの秘匿 | **放棄。** Goldsky エンドポイントは公開（`/api/public/`、`[vars]` に平文）なので元から守れていない |
| 2 | Discord ↔ ウォレット対応表の保護 | **必要。** これだけは D1 にあり公開されていない。§6 参照 |
| 3 | Bot の Discord 上の身体の保護 | **必要。** `*_propose` は Toban Bot の名前で任意チャンネルに投稿できる |
| 4 | マルチテナンシー | **read では「境界」から「既定値」へ格下げ。write では境界のまま** |

4 が変わったのが今回の決定。read はオンチェーン由来なので越境して構わないが、
**エージェントが「自分の担当ワークスペース」を知っている状態にはしたい**ので、
トークンは home となる `treeId` を持つ。

## 3. パッケージ境界

```
@toban/mcp ──binding──> @toban/discord-bot ──binding──> @toban/identity
     └──────────────binding──────────────────────────────────┘
```

循環なし（discord-bot は mcp を知らない）。

```
pkgs/extensions/mcp  (@toban/mcp)          ← 新 Worker
  POST /mcp                 protocol, auth, tools
  POST /api/mcp-tokens      トークン発行 API（§5）
  src/queries.ts            read 専用 Goldsky クエリ
  → IDENTITY      binding   account <-> wallet
  → CONFIRM       binding   確認チャネルのアダプタ（差し替え可能）

pkgs/extensions/discord-bot                ← 署名の持ち主のまま
  スラッシュコマンド / interactions / Turnkey
  performThx, performQuestSubmit, ボタン処理
  POST /internal/propose    ← MCP からの依頼口（新設）
```

**Write はエージェント自身が行わない。** `@toban/mcp` は署名の手段を一切持たず、
確認チャネルのアダプタに**依頼を送るだけ**。今は Discord bot が唯一のアダプタだが、
binding が無い構成なら `tools/list` から propose 系を落とし、read だけの MCP サーバーとして
成立する。

### `POST /internal/propose` の契約

またぐのはこれ 1 本だけ。

リクエスト:

| フィールド | |
|---|---|
| `kind` | `"thx"` / `"quest"` |
| `treeId` | トークンの home ワークスペース |
| `channelId` | 投稿先 |
| `forDiscordUserId` | ボタンを押せる人の候補 |
| thx | `toDiscordUserId` または `toAddress`、`amount`、`message` |
| quest | `questId` |

レスポンス: `ok` / 拒否理由（ユーザー向け日本語）と、投稿したメッセージ id。

**またがないもの** — invariant が保たれる理由:

- **Turnkey stamper 資格情報** — discord-bot のみ。MCP Worker は署名手段を持たない
- **actor** — `interaction.member.user.id` から読む。MCP から渡るのは「誰が押せるか」の
  候補だけ。実際に誰が実行するかは Discord が Ed25519 署名した interaction が決める
- **`performThx` / `performQuestSubmit`** — 呼び出し元が「slash command と button handler の
  2 つだけ」という現状が維持される。`turnkey/policy.json` が gate する selector を
  組み立てる場所は 1 パッケージに閉じたまま
- **`buildConfirmMessage` / `encodePayload` / `handleConfirmButton`** — 全部 discord-bot

型は discord-bot が持ち、`@toban/mcp` が `import type` する（実装は import しない）。
食い違いがコンパイル時に出る。

### ワークスペース照合の向きが逆になる

今は「トークンのギルド == チャンネルのギルド」を照合している。home が `treeId` になると
逆向きになる:

```
channelId ──(rest.getChannelGuildId)──> guildId
          ──(identity: getPlatformLink)──> treeId'
          treeId' === 依頼の treeId か？
```

identity Worker に逆引き API を足す必要はない。既にチャンネル所属チェックをしている
`proposeTool` の中で、向きを変えるだけ。検証の強度は同じ（チャンネルを他ワークスペースに
向けられない）。

**`ConfirmPayload.guildId` は discord-bot が自分で確定した値を埋める。** 外から来た値が
ペイロードに入らなくなるので、今より安全側。

## 4. トークン設計

### 形式

```
現行  tbn1.<guildId>.<mac>   mac = HMAC-SHA256(secret, "mcp:v1:" + guildId)
新    tbn2.<treeId>.<tokenId>.<mac>
      mac = HMAC-SHA256(secret, "mcp:v2:" + treeId + ":" + tokenId)
```

**プレフィックスと MAC のメッセージ両方を変えること。** `guildId` も `treeId` も
`^\d+$` を通るので、MAC のメッセージ prefix を据え置くと
`HMAC(secret, "mcp:v1:42")` が「ギルド 42 のトークン」としても「tree 42 のトークン」
としても検証を通ってしまう。`tbn2` にしておけば古いトークンは malformed で明確に落ちる
（19 桁の snowflake が treeId として解釈されて謎のエラーになるのを防ぐ）。

### 検証の 2 段

1. **MAC をステートレスに検証**（今と同じ）。デタラメなトークンを D1 に触らず弾く
2. **`tokenId` を登録簿と照合**して失効を確認

`auth.ts` が「失効が全か無か」を既知の限界として書いているのがこれで解ける。1 で
ふるってから 2 に行くので、攻撃者が D1 の読みを大量に誘発することはできない。

### 登録簿

`@toban/mcp` が所有するテーブル。共有 D1 に置くが、**Worker ごとに自分のテーブルを
所有し、他 Worker のテーブルには HTTP 越しにしか触らない**という既存ルール
（discord-bot が identity テーブルを直接書かない）をそのまま適用する。

| カラム | |
|---|---|
| `token_id` | トークンに埋まる id |
| `tree_id` | home ワークスペース |
| `label` | 発行時にユーザーが付ける名前（「うちの OpenClaw」等） |
| `created_by` | 発行したウォレット |
| `created_at` | |
| `revoked_at` | NULL なら有効 |

平文のトークンは保存しない（MAC で再計算できるので保存する必要がない）。

## 5. 発行の導線

`/$treeId/settings`（`pkgs/frontend/app/routes/$treeId_.settings.tsx`、既存）に
セクションを足す。同ルートは既に `useActiveWallet`（Privy）と `topHat` を持っているので
足場はある。

```
1. /$treeId/settings で「MCP トークンを発行」、label を入力
2. Privy のウォレットで認証
3. POST /api/mcp-tokens { treeId, label }  → @toban/mcp
     Worker: Privy の JWT を JWKS で検証 → wallet を確定
             Hats subgraph で wallet が treeId の operator/top hat を着ているか検証
             token_id を発行し登録簿に記録、トークンを組み立てて返す
4. 平文を一度だけ表示（以後は再表示できない）
5. 同じ画面に発行済み一覧（label / 発行日 / 発行者）と失効ボタン
```

**検証はフロントではなく Worker が行う。** フロントの hat 表示は UI の都合で、認可の
根拠にはしない。

これで従来の発行まわりの問題が解ける:

| 従来 | |
|---|---|
| `MCP_TOKEN_SECRET` の平文を運営が手元に保管する必要があった | 不要。運営の手作業がゼロ |
| 発行台帳が存在しなかった | 登録簿ができる |
| 配布経路が「運用者に渡す」だけで未定義 | 渡さない。本人が自分で発行する |
| `mint-mcp-token` が platform link の有無を検証していなかった | hat 保有を検証する |
| 失効が全ギルド一括のみ | 個別失効ができる |

`scripts/mint-mcp-token.ts` は運営用の非常口として残す（フロントが落ちているときや、
まだ hat を持っていない相手に出すとき）。ただし主経路にはしない。

### OAuth はやらない

MCP の認可仕様（OAuth 2.1 / RFC 9728 / RFC 8707）には対応しない。理由:

- 主要な消費者である OpenClaw は**多数の人の代理で動く常駐エージェント**で、
  per-user OAuth はモデルが合わない。`openclaw mcp login` が認証するのは 1 identity
  だけなので、そのエージェントの提案が全部「運用者本人向け」になってしまう
- セルフサービス発行に必要だったのは「ウォレット署名 + hat 検証」の部分だけで、
  それは §5 で OAuth 無しに実現できる。DCR / PKCE / discovery / token endpoint は
  この用途では機構だけが重い
- 将来「個人が自分用に MCP を使う」形が必要になったら足せる。OpenClaw 側は
  `auth: "oauth"` と `openclaw mcp login`（`--code` でヘッドレス可、
  トークンは `<state-dir>/state/openclaw.sqlite` の `mcp_oauth_stores`）を持っているので、
  クライアント側の障害はない

## 6. read の越境と identity の扱い

**決定**: read は他ワークスペースも読めてよい。オンチェーン由来のデータであり、
Goldsky が公開なので隠す意味がない。トークンの `treeId` は境界ではなく既定値。

- `toban_workspace_info` — 引数なしで home を返す（エージェントが自分の担当を知る手段）
- 他の read ツール — `treeId` を任意引数にし、省略時は home

**決定**: identity の解決（§2 の仕事 2）は **home ワークスペースに限る**。

subgraph データと違い、`discordUserId → wallet` と `wallet → discordUserId` は D1 にあり
公開されていない。越境 read を無制限にすると、A コミュニティのトークンで B コミュニティの
「Discord ID ↔ ウォレット」名簿が作れてしまう。ここだけは越境させない。

| | home ワークスペース | 他ワークスペース |
|---|---|---|
| subgraph 由来のデータ | 返す | 返す |
| `discordUserId` 引数の解決 | する | **しない**（引数自体を拒否） |
| `*DiscordUserId` の逆引き | する | **しない**（`null`） |

実装上は、identity Worker を呼ぶ前に「対象の `treeId` == token の home か」を見るだけ。
ツールの引数は増えない。各 read ツールの description に

> 他のワークスペースを指定した場合、Discord ユーザー ID は解決されずアドレスのみ返る

の 1 行を加える。

この線を選ぶ理由は、**「公開されているか」で切ると説明が一貫する**こと。Goldsky と
チェーンは誰でも読めるので隠す意味がなく、D1 の対応表は誰も読めないので越境させない。
「read だから全部自由」でも「トークンのワークスペース以外は全部禁止」でもなく、
データの出自で決まる。

## 7. 確認ボタンは残る

OAuth を入れないので当然だが、**入れたとしても残す**。ボタンは 2 つの仕事をしていて、
認証で代替できるのは片方だけ。

1. 「誰が actor か」の証明 → 認証で代替可能
2. **「本人が今まさにこの取引を意図した」という取引ごとの同意** → 代替できない

エージェントがプロンプトインジェクションされた場合、2 が本質。正規の資格情報を持った
エージェントが「999 THX を攻撃者に送れ」と騙されたら、資格情報は本物なので通る。
ボタンは「署名の直前に人間が金額と宛先を目で見る」を強制する装置であり、
認証とは別のレイヤー。

## 8. 移行とデプロイ

### 移行

1. `pkgs/extensions/mcp` を作り、`src/mcp/{index,auth,protocol,tools,queries}.ts` を移す
2. discord-bot に `POST /internal/propose` を新設し、`proposeTool` の中身を移す
   （`buildConfirmMessage` / `discord-rest` はそのまま discord-bot に残る）
3. `@toban/mcp` の propose ツールは `CONFIRM` binding への転送だけにする
4. トークンを `tbn2` に切り替え、登録簿テーブルを作る
5. フロントに発行セクションを足す
6. 既存トークンを再発行（Sepolia の 1 ギルド分）
7. `guilds.json` / OpenClaw の `mcpUrl` を新 Worker に向け、`push:config`

`src/mcp/` から出ていくものと残るものの境目は「`ConfirmPayload` を触るか」。触るものは
残す。

### デプロイ順

```
identity → discord-bot → mcp → openclaw
```

`@toban/mcp` は discord-bot に service binding するので、**discord-bot が先**
（無いと Cloudflare error 10143）。OpenClaw は MCP エンドポイントを叩くので最後。
`DEPLOYMENT.md` の §6 / §7 に 1 段挿入する形。

### secrets の移動

| | 移動先 |
|---|---|
| `MCP_TOKEN_SECRET` | `@toban/mcp` へ**移動**（discord-bot からは削除） |
| `GOLDSKY_GRAPHQL_ENDPOINT` / `HATS_GRAPHQL_ENDPOINT` | 両方に必要（複製） |
| `LOOKUP_READ_SECRET` | 両方に必要（複製）。identity Worker の値と一致させる |
| `RPC_URL` | 両方に必要。`toban_member_status` の枠計算がオンチェーン read |
| Turnkey / Discord 系 | discord-bot のみ（移動しない） |

### 既知のコスト

- **ABI 断片が 2 箇所になる。** `toban_member_status` の「送れる枠」は
  `mintAllowance` / `mintableAmount` のオンチェーン read なので、`@toban/mcp` が
  **view 専用**の ABI 断片を持つ。`turnkey/policy.json` が gate しているのは state を
  変える selector だけなので policy 同期の invariant は壊れないが、
  discord-bot の CLAUDE.md の「`chain.ts` が ABI の single source of truth」は
  「**書き込み selector は** `chain.ts`」に書き換える必要がある
- デプロイ順が 1 段増える（`DEPLOYMENT.md` は順序依存が壊れやすいと自ら警告している箇所）
- secrets が一部二重管理になる（上表）
