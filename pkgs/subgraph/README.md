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

## deploy 前に `config/<net>.json` を更新する

| 変更したもの | 直す項目 |
|---|---|
| コントラクトを新規デプロイした（アドレスが変わった） | `address` を新しい BigBang アドレスに |
| 上記に伴い | `startBlock` をデプロイ直前のブロック番号に（`pnpm contract getChainInfo` で取得） |
| イベント署名を変えた | `handlers[].event` の署名文字列 |

> ⚠️ **`startBlock` は全 data source 共通のグローバル値**です。上げると BigBang 以外
> （ScheduledDistributorFactory など）の履歴も切り捨てられます。

## イベント署名を変えたときの破壊的影響

graph-node はイベントを **topic0（署名ハッシュ）** で照合します。`Executed` に引数を 1 つ足すだけで
topic0 が変わり、**旧コントラクトが emit 済みのイベントは新しい config では一切マッチしません**。
つまり**既存ワークスペースがインデックスから消えます**。どちらかを選んでください。

- **(A) 作り直してよい** — `pnpm subgraph delete:<net>` してから、新しい `startBlock` で再デプロイ。
- **(B) 既存を残したい** — 旧署名と新署名の**両方**の handler を `config/<net>.json` に登録し、
  旧署名用に `handleExecutedLegacy`（新フィールドを 0 で埋める）を実装する。

## その他

- ABI は `abis/` に置いたものを codegen が読みます。コントラクト変更後は
  `pnpm contract sync:abis` で再生成されるので、手でコピーしないでください。
- AssemblyScript は TypeScript ではありません（クロージャ不可、整数型が明示的、など）。
  マッピングはエンティティ書き込み以外の副作用を持たせず、再インデックスで同じ状態になるようにします。

## 検証

```bash
curl -s -X POST "<GOLDSKY_ENDPOINT>" -H "content-type: application/json" \
  -d '{"query":"{_meta{block{number} hasIndexingErrors} workspaces(first:3){id}}"}'
```

`hasIndexingErrors: false` かつ `_meta.block.number` が伸びていれば OK。

フロントの gql 型は**デプロイ済みの**エンドポイントから生成されるため、
`pnpm frontend codegen` は必ずこの後に実行します。
