# `@toban/frontend`

React Router v7（Remix の後継）+ Vite の SSR アプリ。Tailwind v4 / shadcn/ui、ウォレットは Privy、
チェーン読み書きは viem、データは Goldsky の subgraph を Apollo で引きます。

- **デプロイ全体の順序は [`DEPLOYMENT.md`](../../DEPLOYMENT.md)（リポジトリルート）。**
  フロントは **subgraph を deploy した後**でないと `codegen` が通りません。
- アーキテクチャ・コンポーネント規約・デザインシステムは [`CLAUDE.md`](./CLAUDE.md)。

## コマンド

リポジトリルートから `pnpm frontend <script>` で叩きます（`cd` しない）。

```bash
pnpm frontend dev          # Sepolia（.env）
pnpm frontend dev:base     # Base（.env.base）

pnpm frontend codegen      # Sepolia のスキーマから gql 型を生成（.env）
pnpm frontend codegen:base # Base のスキーマから生成（.env.base）

pnpm frontend typecheck    # react-router typegen && tsc --noEmit
pnpm frontend build
pnpm frontend start        # build/server/index.js を配信
pnpm frontend ladle        # コンポーネントカタログ
```

**ネットワークの切り替えは `.env` / `.env.base` の読み分けだけ**です（`dotenv -e .env.base`）。
`dev` / `codegen` は `.env`、`dev:base` / `codegen:base` は `.env.base` を読みます。

## ★ `codegen` は subgraph を deploy した後

`codegen.ts` は `VITE_GOLDSKY_GRAPHQL_ENDPOINT` が指す**稼働中の**スキーマを読みます
（設定ファイルにエンドポイントはハードコードされていません。未設定だと即エラーで止まります）。
subgraph より先に走らせると、新しいフィールドが型に現れず typecheck が落ちます。

生成物（`gql/`）は**コミットされています**。subgraph のスキーマを変えていないなら再生成は不要です。

> **落とし穴**: subgraph に無いフィールドを gql クエリに足すと、そのネットワークでは
> GraphQL のバリデーションエラーになり `useGetWorkspace` が全滅します。
> **両ネットワークの subgraph スキーマを揃えてから**フロントを出してください。

## 環境変数

`.env`（Sepolia） / `.env.base`（Base）。雛形は `.env.example`。
**コントラクトを新規デプロイしてアドレスが変わったら、先にここを直します。**

| 区分 | 変数 |
|---|---|
| チェーン | `VITE_CHAIN_ID` / `VITE_ALCHEMY_KEY` |
| コントラクト | `VITE_BIGBANG_ADDRESS` / `VITE_HATS_ADDRESS` / `VITE_FRACTION_TOKEN_ADDRESS` / `VITE_SPLITS_CREATOR_ADDRESS` / `VITE_SCHEDULED_DISTRIBUTOR_FACTORY_ADDRESS` |
| インデクサー | `VITE_GOLDSKY_GRAPHQL_ENDPOINT` / `VITE_HATS_GRAPHQL_ENDPOINT` / `VITE_THEGRAPH_API_KEY` |
| ウォレット / AA | `VITE_PRIVY_APP_ID` / `VITE_PIMLICO_API_KEY` |
| ストレージ・名前解決 | `VITE_PINATA_JWT` / `VITE_PINATA_GATEWAY` / `VITE_PINATA_GATEWAY_TOKEN` / `VITE_NAMESTONE_API_KEY` |
| Splits | `VITE_SPLITS_API_KEY` |
| Discord 連携 | `VITE_IDENTITY_WORKER_URL` / `VITE_BOT_WORKER_URL` / `VITE_DISCORD_BOT_SIGNER_ADDRESS` |

Discord 連携の 3 つは**ネットワークごとに値が違います**。未設定でもビルドは通り、該当 UI
（「サーバーに追加」ボタンなど）が出ないだけなので、抜けに気づきにくい点に注意してください。

> ⚠️ **`VITE_*` はビルド時にクライアントへ埋め込まれ、公開されます。** 秘密にできる値ではありません。
> The Graph / Alchemy のキーは**ドメイン allowlist** で保護してください。
> allowlist 付きのキーは Origin を持たないサーバー（Cloudflare Worker）からは使えません —
> bot 用には Authorized Domains を空にした別キーを発行します。

## ホスティング

デプロイ先は **Vercel** です。`react-router.config.ts` が `@vercel/react-router` の
`vercelPreset()` を presets に登録しており、これがビルド成果物を Vercel の形に整えます。

```ts
// pkgs/frontend/react-router.config.ts
export default { ssr: true, presets: [vercelPreset()] } satisfies Config;
```

**リポジトリに入っているのはこの preset だけ**です。プロジェクトの紐付け、本番の環境変数、
ドメイン（https://toban.xyz）は Vercel 側で管理されており、`vercel.json` もリポジトリにはありません。
GitHub Actions（`.github/workflows/build-frontend.yml`）は main への push と PR で
`pnpm frontend build` を回してビルドが壊れていないか見るだけで、デプロイはしません。

ビルド成果物は `build/client`（静的アセット）と `build/server`（SSR エントリ）です。

> **SSR は必須です。** `ssr: false`（SPA モード）に切り替えないでください。
> ハイドレーション不整合は原因ごとに個別に直します。
