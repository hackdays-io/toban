# `@toban/subgraph`

Toban のインデクサー（The Graph / AssemblyScript マッピング、**Goldsky** でホスティング）。
`BigBang.Executed` を起点に、ワークスペースごとのモジュール（Hats モジュール / ThanksToken /
SplitsCreator）を動的テンプレートとして追跡します。

- **デプロイ手順の正は [`DEPLOYMENT.md`](../../DEPLOYMENT.md)（リポジトリルート）です。**
  subgraph は **contract → sync:abis の後、frontend codegen の前**という順序に挟まれています。
- エンティティ / マッピングの構成は [`CLAUDE.md`](./CLAUDE.md) を参照。

| | Sepolia | Base |
|---|---|---|
| デプロイ先 | `toban-sepolia/1.0.3` | `toban-base/0.0.1` |

## コマンド

リポジトリルートから `pnpm subgraph <script>` で叩きます（`cd` しない）。

```bash
goldsky login                  # 初回のみ

pnpm subgraph prepare:<net>    # config/<net>.json + template → subgraph.yaml
pnpm subgraph codegen          # → generated/（AssemblyScript 型）
pnpm subgraph build
pnpm subgraph deploy:<net>

pnpm subgraph update:<net>     # メタデータ更新
pnpm subgraph delete:<net>     # 作り直すときだけ
```

`<net>` は `sepolia` / `base`。

> `subgraph.yaml` は **生成物**です（gitignore）。`subgraph.template.yaml` と
> `config/<net>.json` を編集してください。直接編集しても次の `prepare:*` で消えます。

## 変更するときに踏みやすいところ

- **`startBlock` は全 data source 共通のグローバル値**です。上げると BigBang 以外
  （ScheduledDistributorFactory など）の履歴も切り捨てられます。
- **イベント署名を変えると既存データが消えます。** graph-node は topic0（署名ハッシュ）で
  照合するため、旧コントラクトが emit 済みのイベントは新 config では一切マッチしません。
  既存ワークスペースを残したい場合は、旧署名と新署名の**両方**の handler を登録して
  旧用のレガシーハンドラを実装する必要があります。
- ABI は `abis/` に置いたものを codegen が読みます。コントラクト変更後は
  `pnpm contract sync:abis` で再生成されるので、手でコピーしないでください。

## 検証

```bash
curl -s -X POST "<GOLDSKY_ENDPOINT>" -H "content-type: application/json" \
  -d '{"query":"{_meta{block{number} hasIndexingErrors} workspaces(first:3){id}}"}'
```

`hasIndexingErrors: false` かつ `_meta.block.number` が伸びていれば OK。

フロントの gql 型は**デプロイ済みの**エンドポイントから生成されるため、
`pnpm frontend codegen` は必ずこの後に実行します。
