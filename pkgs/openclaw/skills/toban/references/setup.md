# Toban MCP サーバーの登録

このスキルは Toban の MCP サーバーが登録されていることを前提にします。

## 1. トークンを受け取る

Toban の運営から、**あなたの Discord サーバー専用のトークン**を受け取ってください。
形式は `tbn1.<guildId>.<...>` です。

トークンにはサーバー ID が埋め込まれており、**そのサーバーのワークスペースしか
読めません**。他のサーバーの情報は、エージェントが何を出力しても取得できません。

前提として、そのサーバーに **Toban Bot が導入済み**である必要があります。確認ボタンを
投稿し、押されたことを検証するのが Toban Bot だからです。

## 2. 環境変数に入れる

設定ファイルに直書きしないでください。OpenClaw は `${ENV_VAR}` を実行時に解決します。

```bash
export TOBAN_MCP_TOKEN='tbn1....'
```

## 3. `openclaw.json` に足す

```json
{
  "mcp": {
    "servers": {
      "toban": {
        "url": "https://toban-discord-bot-base.kawabeyuki23.workers.dev/mcp",
        "transport": "streamable-http",
        "headers": { "Authorization": "Bearer ${TOBAN_MCP_TOKEN}" },
        "requestTimeoutMs": 20000,
        "toolFilter": { "include": ["toban_*"] }
      }
    }
  }
}
```

エージェントを複数動かしていて Toban を扱わせたいものが限られる場合は、
`codex.agents` にその agent id を並べると、そのエージェントだけに見せられます。

```json
"codex": { "agents": ["community-helper"] }
```

## 4. スキルを入れる

```bash
openclaw skills install <このディレクトリ>
```

もしくは `skills.load.extraDirs` にこのディレクトリの親を足します。

## 5. 確認

```
openclaw skills list
```

エージェントに「Toban のワークスペース情報を見せて」と頼み、`toban_workspace_info` が
呼ばれれば通っています。「連携されていません」と返る場合は、そのサーバーで
`/toban-link` が実行されていません。

## 権限を絞る

サーバー内の全員に使わせたくない場合は、Discord チャンネル側で絞れます。

```json
"channels": { "discord": { "guilds": { "<guildId>": {
  "users": ["<許可する Discord ユーザー ID>"]
}}}}
```

なお、**絞らなくても資産が動くことはありません。** 送付・申請は必ず本人のボタン操作で
確定するので、他人に代わって実行することはできません。絞る目的は、ワークスペースの
読み取り情報（誰がいくら送ったか等）を見せる範囲の管理です。
