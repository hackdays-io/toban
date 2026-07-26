---
title: Supported Networks
---

# 対応ネットワークとコントラクトアドレス

Toban は **Base**（本番）と **Sepolia**（テストネット）に対応しています。

:::warning 最新の値はリポジトリを参照してください

下の表はスナップショットで、コントラクトを再デプロイすると古くなります。
**常に正しいのはリポジトリの
[`pkgs/contract/outputs/contracts-<network>.json`](https://github.com/hackdays-io/toban/tree/main/pkgs/contract/outputs)**
です（デプロイスクリプトが自動更新します）。

:::

## Base（本番）

| Name | ContractAddress |
| --- | --- |
| BigBang（エントリポイント） | 0xda7BFDb08e09Bb3ba0bC8e37c5c322328E458003 |
| HatsTimeFrameModule | 0x7fa6c0F8e4412ED72Ded8d591ABF58B276A992C9 |
| SplitsCreatorFactory | 0x01e7fb1De0919c9743C5a93806CB957214D0d4cC |
| SplitsCreator | 0xbEDa908672b45ce6dd6a5a9461d5e83f03F27C9F |
| ThanksTokenFactory | 0xa183E2C368B2BdDf14cE1C29Dfd23cFE2F7c1280 |
| ScheduledDistributorFactory | 0x90b04bCfa471d9642e12667a5a07094A8f165AdE |

## Sepolia（テストネット）

| Name | ContractAddress |
| --- | --- |
| BigBang（エントリポイント） | 0x010329e42cAc221D799C105516830D84901Dc2Ac |
| HatsQuestModule | 0x84988CD2DdaC2137C9DF6b679341F0F180D9aaf2 |
| HatsTimeFrameModule | 0x7fa6c0F8e4412ED72Ded8d591ABF58B276A992C9 |
| SplitsCreatorFactory | 0x830B6E01bf0d90941c756Ce3d9A24bC6FDCFbAb1 |
| SplitsCreator | 0x3a961240Ae4c01b15170940D2EDfAceCa996f2D8 |
| ThanksTokenFactory | 0xa52E399Bc54f7CeB9d74784dC5D6289B7d970d1C |
| ScheduledDistributorFactory | 0x9eE2641Ba7017C63161C5682F077ab95E6C3eC0D |
| FractionToken | 0xd6031f9543bEB0963e32CA2AC474de69D0515059 |

## 外部プロトコル（全チェーン共通）

Toban が依存している Hats Protocol と 0xSplits のアドレスです。

| Name | ContractAddress |
| --- | --- |
| Hats | 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137 |
| HatsModuleFactory | 0x0a3f85fa597B6a967271286aA0724811acDF5CD9 |
| PullSplitsFactory | 0x80f1B766817D04870f115fEBbcCADF8DBF75E017 |
