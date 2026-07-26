# `document` — Toban ドキュメントサイト

[Docusaurus](https://docusaurus.io/) で作られた利用者向けドキュメントサイトです。
コンテンツは `docs/` 配下の Markdown / MDX。公開先は https://hackdays-io.github.io/toban/ 。

構成と執筆規約は [`CLAUDE.md`](./CLAUDE.md) を参照。

## コマンド

リポジトリルートから `pnpm document <script>` で叩きます（`cd` しない）。

```bash
pnpm document start       # ローカル開発サーバー（ホットリロード）
pnpm document build       # 静的サイトを build/ に生成
pnpm document serve       # build/ の内容を配信して確認
pnpm document typecheck   # tsc
pnpm document clear       # Docusaurus のキャッシュ削除（MDX が固まったとき）
```

## デプロイ

**手動デプロイは不要です。** `main` への push で GitHub Actions
（[`deploy-document.yml`](../../.github/workflows/deploy-document.yml)）が
`pnpm document build` を実行し、成果物を GitHub Pages に公開します。

`package.json` には Docusaurus 標準の `deploy` スクリプト（`gh-pages` ブランチへ直接 push する
`USE_SSH=true yarn deploy` 相当）が残っていますが、**この運用では使いません**。手元から叩くと
Actions が管理しているデプロイと競合します。

## コンテンツを書くときの注意

- コントラクトアドレスやネットワーク情報を載せるページ（`docs/supportedNetworks.md` など）は、
  デプロイのたびに古くなります。**一次情報は `pkgs/contract/outputs/contracts-<net>.json`** です。
  ここは公開サイトなので、古い値を残すと外部の利用者が間違ったアドレスを使います。
- 数式は `$...$`（インライン）/ `$$...$$`（ブロック）。`remark-math` / `rehype-katex` が設定済みです。
- Biome は `**/docs` を除外しているので、Markdown の整形は手動です。
- パッケージマネージャは **pnpm** です（ルートで `pnpm@10.15.0` に固定）。`yarn` は使いません。
