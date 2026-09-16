# Toban MCP サーバーの登録

このスキルは Toban の MCP サーバーが登録されていることを前提にします。

## 1. トークンを発行する

トークンは Toban の運営から受け取るのではなく、**ワークスペースの管理者
（operator hat または top hat の保有者）が自分で発行します**。Toban の
`https://toban.xyz/<treeId>/settings`（ワークスペース設定画面）の「MCP トークン」
セクションで、ウォレット署名だけで発行できます。運営への問い合わせは不要です。

形式は `tbn2.<treeId>.<tokenId>.<mac>` です。`treeId` はこのトークンの home
ワークスペースですが、これは既定値であって壁ではありません — 読み取りツールは
`treeId` 引数を渡せば他のワークスペースの情報も返します（オンチェーン／Goldsky
由来のデータは元々公開されているため）。Discord ユーザー ID の逆引きと、起案系
ツール（`toban_thx_propose` 等）は home ワークスペースに限られます。

前提として、そのサーバーに **Toban Bot が導入済み**である必要があります。確認ボタンを
投稿し、押されたことを検証するのが Toban Bot だからです。

## 2. 環境変数に入れる

設定ファイルに直書きしないでください。OpenClaw は `${ENV_VAR}` を実行時に解決します。

```bash
export TOBAN_MCP_TOKEN='tbn2....'
```

## 3. `openclaw.json` に足す

```json
{
  "mcp": {
    "servers": {
      "toban": {
        "url": "https://toban-mcp-base.kawabeyuki23.workers.dev/mcp",
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
