# `@toban/openclaw` (`pkgs/openclaw`)

Fly.io 上で動く [OpenClaw](https://docs.openclaw.ai/) ゲートウェイのデプロイ設定。
公式イメージをそのまま動かすので、**アプリケーションコードは無い**。ここにあるのは
デプロイ設定・設定テンプレート・エージェントへの指示書と、それを組み立てるスクリプト。

## Important invariants

- **この環境に Turnkey の stamper を置かない。** 署名は `@toban/discord-bot`
  （Cloudflare Workers）に残す。Turnkey のポリシーは selector / `chain_id` /
  `value` しか検証しておらず、「誰として実行するか」を表す引数 0 は TEE で
  再検証されない（`pkgs/extensions/discord-bot/turnkey/policy.json` の `_gaps` #1）。
  actor の正しさは Worker が identity Worker 経由で解決していることに依存している。
  OpenClaw は Discord 上の他人のメッセージをプロンプトに取り込む汎用エージェントなので、
  ここに stamper を置くとプロンプトインジェクションで actor を差し替えた `mintFrom` が
  成立する。**エージェントは提案するだけで、確定は Worker が出す確認ボタンのクリック
  （Discord が署名した interaction）で行う。**
- **`channels.discord.commands.native` は必ず `false`。** Interactions Endpoint URL は
  discord-bot Worker が持っているので、Discord の仕様上 OpenClaw は
  `INTERACTION_CREATE` を Gateway で受け取れない。既定の `auto` のまま起動すると
  スラッシュコマンドを自動登録し、Worker の guild 単位 bulk PUT
  （`src/api/install/callback.ts` / `scripts/register-commands.ts`）と相互に消し合う。
  `src/render-config.ts` が強制し、テンプレートが `true` なら例外にする。
- **ギルドごとに agent を分け、MCP サーバーを `codex.agents` で紐づける。** Gateway は
  アプリ単位なので 1 インスタンスが全ギルドのメッセージを受ける。`platform_links` は
  ギルド単位でワークスペース（＝コントラクト clone、＝チェーン）を決めるため、
  「今どのワークスペースか」をエージェントの状態にしてはいけない。ギルドを**資格情報側**
  （MCP エンドポイントとヘッダ）に固定することで、モデルの出力が何であれ他ギルドの
  データは引けなくなる。メモリも agent スコープなのでサーバー間の文脈混線も防げる。
- **秘密は設定ファイルに直書きしない。** OpenClaw は `${ENV_VAR}` を実行時に解決するので、
  MCP の `Authorization` などはそちらを使う。`/data/openclaw.json` はボリューム上に
  残り続けるため、`assertNoInlineSecrets` が既知の形（Anthropic / OpenAI / Slack /
  Discord のトークン、リテラルな Bearer）を検出して落とす。
- **設定の実体はボリューム上の `/data/openclaw.json`。** `fly deploy` では入れ替わらない。
  リポジトリの JSON は**テンプレート**であって設定そのものではない。

## OpenClaw のスキーマはテンプレートが持つ

`config/openclaw.template.json` の `$toban.perGuild` が、ギルドごとの agent / binding /
MCP サーバー / 許可リストの**形**を持っている。`src/render-config.ts` はプレースホルダの
差し込みと配置、そして検証しかしない。

これは意図的な分担。OpenClaw の設定スキーマは本家の更新で変わるので、TypeScript に
写すと二重管理になる。テンプレートなら `openclaw config schema` で検証して直せる。
**スキーマのキー名を変えたくなったら、テンプレートだけを直す。**

実際、初回デプロイでドキュメントから推測したキーが 2 つ間違っていた
（`agents.entries.<id>.instructions` は存在しない / `bindings` はルート直下で
`multiAgent.bindings` ではない）。直したのはテンプレートと配置先の 1 行だけで済んだ。
キー名は**必ず実機の `openclaw config schema` で確認する**こと。ドキュメントは信用しない。

**指示書の渡し方**: `agents.entries.<id>` に instructions キーは無い。ワークスペース直下の
`AGENTS.md` がシステムプロンプトへ注入されるので、`push-config.sh` が
`instructions/TOBAN.md` を各ワークスペースへ `AGENTS.md` として置いている。

配置先だけは `render-config.ts` が決めている:

| `$toban.perGuild` | 配置先 |
|---|---|
| `agent` | `agents.entries[toban-<label>]` |
| `binding` | ルート直下の `bindings[]`（要素に `type: "route"`） |
| `mcpServer` | `mcp.servers[toban-<label>]` |
| `discordGuild` | `channels.discord.guilds[<guildId>]` |

## プレースホルダ

`{{label}}` `{{guildId}}` `{{treeId}}` `{{chainId}}` `{{agentId}}` `{{mcpServerId}}`
`{{mcpUrl}}` `{{allowUsers}}` `{{channels}}`

値がまるごと `"{{key}}"` で、差し込む値が**配列かオブジェクトのときだけ**型が保たれる。
数値・真偽値は常に文字列になる（`chainId` は HTTP ヘッダに入るため）。未知のキーは
エラー。

## レンダリング時の検証（`renderConfig`）

壊れた設定をボリュームへ送り込まないための門番。テストは `test/render-config.test.ts`。

- `commands.native` を `false` に固定（テンプレートが `true` なら例外）
- `allowUsers` が空のギルドを弾く — 空にすると Bot が参加している全員に反応する
- `label` / `guildId` の重複、snowflake でない `guildId` を弾く
- 差し込まれずに残った `{{...}}` を弾く（テンプレートの打ち間違い検出）
- 秘密の直書きを弾く
- MCP エンドポイントが `https`（`localhost` のみ例外）

## When making changes

- 署名まわりの機能をここに足さない。`@toban/discord-bot` 側の MCP ツールとして足す
- ギルドを増やすときは `config/guilds.json` に足すだけ。テンプレートは触らない
- `instructions/` を変えたら **`push:config`**（イメージには焼き込まれていない）
- `fly.toml` の `[build] image` は必ずバージョン固定。`latest` / `main` /
  `extended-stable` は使わない。自前ビルドはしない（Dockerfile は持たない）
- `fly.toml` の `--allow-unconfigured` を消さない。初回に「設定が無いと起動しない ↔
  起動していないと設定を送れない」で詰む
