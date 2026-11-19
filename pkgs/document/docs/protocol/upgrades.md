---
title: アップグレード方針
sidebar_position: 4
---

# アップグレード方針

| コントラクト | 方式 | アップグレードする人 |
| --- | --- | --- |
| BigBang | UUPS proxy(OpenZeppelin upgradeable 5.0.2) | owner(`upgradeToAndCall`) |
| SplitsCreatorFactory | UUPS proxy | owner |
| ThanksTokenFactory | UUPS proxy | owner |
| ScheduledDistributorFactory | UUPS proxy | owner |
| SplitsCreator、ThanksToken、ScheduledDistributor | factory の実装の最小限の clone(Solady の `LibClone`) | できない。clone は変更できない。 |
| Hats のモジュール | `HatsModuleFactory` が作る clone | できない |

このため、次のことが成り立つ。

- **既存のワークスペースは、作られたときのロジックのまま動く。** factory の実装を差し替えても(`setImplementation`)、BigBang のモジュールの実装を差し替えても(`setHats*ModuleImpl`)、影響を受けるのはそのあとに作られるワークスペースだけである。
- **split は確定したら変わらない。** SplitsCreator が作った [0xSplits](https://splits.org/) の split は、配分をずっと保つ。式を変えても、変わるのはこれから作る split だけである。
- **原則はコードと一緒に版を重ねる。** モジュールのページは、`main` の実装を説明する。変更で原則が成り立たなくなれば、Lean の証明か差分テストが失敗するので、同じプルリクエストで原則を書き直す。

デプロイとアップグレードの手順は [`DEPLOYMENT.md`](https://github.com/hackdays-io/toban/blob/main/DEPLOYMENT.md) にある。
