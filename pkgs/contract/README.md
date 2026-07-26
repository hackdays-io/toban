# `@toban/contract`

Toban のスマートコントラクト（Hardhat + Viem toolbox、Solidity 0.8.24、UUPS アップグレーダブル）。
Hats Protocol v1 と 0xSplits の上に、ワークスペース（＝ロールの木）と報酬分配を組み立てます。

- **デプロイ手順の正は [`DEPLOYMENT.md`](../../DEPLOYMENT.md)（リポジトリルート）です。**
  コントラクトだけを見て進めるとインデクサーとフロントが壊れます。
- 設計・命名・ファイル構成は [`CLAUDE.md`](./CLAUDE.md) に詳しく書いてあります。

## コマンド

リポジトリルートから `pnpm contract <script>` で叩きます（`cd` しない）。

```bash
pnpm contract compile
pnpm contract test                  # 単体: pnpm contract test test/BigBang.ts
pnpm contract coverage
pnpm contract lint                  # solhint --fix
pnpm contract local                 # ローカル hardhat node

pnpm contract sync:abis             # ★ 変更後は必ず（後述）

pnpm contract getBalance    --network <sepolia|base>
pnpm contract getChainInfo  --network <sepolia|base>   # ← subgraph の startBlock に使う
```

デプロイ / アップグレード:

```bash
pnpm contract deploy:all           --network <net>   # CREATE2 で全 impl + factory
pnpm contract upgrade:BigBang      --network <net>   # UUPS（アドレス据え置き）
pnpm contract upgrade:FractionToken --network <net>
pnpm contract upgrade:ThanksTokenImpl --network <net>
```

ワークスペースを 1 つ作る（Hardhat タスク）:

```bash
pnpm contract bigbang --owner <addr> --tophatdetails <uri> --network <net>
pnpm contract mintHat --hatid <id> --wearer <addr> --module <addr> --network <net>
```

`deploy:all` は CREATE2 なので、**bytecode が変わっていないコントラクトは既存アドレスを再利用**
します（`already deployed at ...` と出てスキップ）。BigBang は impl が変わると proxy の initcode も
変わるため**アドレスが変わります**。

## ★ 変更したら `sync:abis`

```bash
pnpm contract compile
pnpm contract sync:abis    # → pkgs/frontend/abi/*.ts, pkgs/subgraph/abis/*.json
pnpm biome:format pkgs/frontend/abi/ pkgs/subgraph/abis/
```

`BigBang.Executed` にフィールドを 1 つ足すだけで topic0（イベント署名ハッシュ）が変わります。
`pkgs/frontend/abi/bigbang.ts` が古いままだと `useBigBang` の `parseEventLogs({strict:true})` が
一致せず `undefined` になり、**tx は成功しているのにワークスペース作成が必ず失敗**します。
ABI を手書きで直さず、必ず `sync:abis` を使ってください。

イベントを追加・変更した場合は、続けて subgraph（`config/<net>.json` とマッピング）と
フロントの gql まで通す必要があります。順序は [`DEPLOYMENT.md`](../../DEPLOYMENT.md) を。

## ネットワークと鍵

`hardhat.config.ts` で定義。**テストネットと本番で鍵が別**です。

| network | 鍵 | Etherscan キー |
|---|---|---|
| `sepolia` / `holesky` | `PRIVATE_KEY` | `ETHERSCAN_API_KEY` |
| `base` | **`PRODUCTION_PRIVATE_KEY`** | `BASESCAN_API_KEY` |

必要な `.env` は [`CLAUDE.md`](./CLAUDE.md) の「Required env」を参照。

## デプロイ済みアドレス

一次情報は `outputs/contracts-<net>.json`（デプロイスクリプトが自動生成）。
**手で編集しないでください。** スナップショットはルートの `README.md` と
[`DEPLOYMENT.md` §10](../../DEPLOYMENT.md) にあります。
