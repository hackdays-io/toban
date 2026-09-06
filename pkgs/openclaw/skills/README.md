# 配布用スキル

`toban/` は **Toban を導入していないチームにも配れる** OpenClaw スキルです。既に自分たちの
OpenClaw を動かしているコミュニティが、Toban Bot を導入したうえでこのスキルと MCP サーバーを
登録すれば、**自分たちのエージェントに** Toban を扱わせられます。

我々の `pkgs/openclaw` のデプロイとは独立しています。中身は Toban 側の MCP サーバー
（`pkgs/extensions/discord-bot/src/mcp/`）に依存するだけなので、このディレクトリを
そのまま渡すか、git URL / ローカルディレクトリとして `openclaw skills install` させます。

形式（`SKILL.md` + YAML frontmatter、`references/`）は OpenClaw 2026.9.1 の同梱スキルに
合わせてあります。
