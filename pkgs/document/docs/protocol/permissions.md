---
title: 権限モデル
sidebar_position: 3
---

# 権限モデル

Toban の権限は 2 種類ある。

- **プロトコルの owner**: アップグレードできるシングルトン(`BigBang` と、SplitsCreator・ThanksToken・ScheduledDistributor の各 factory)の owner。これらをアップグレードでき、*新しく作る*ワークスペースが使う実装や依存先を差し替えられる。既存のワークスペースの中では、特別な権限を持たない。
- **ワークスペースのロール**: ワークスペースの中の権限は Hats Protocol が決める。`bigbang` は top hat を自分自身に mint し、ワークスペースの hat を作ったあと、top hat を `_owner` に移す。以後は top hat の着用者がツリーを管理し、各モジュールは hat の admin か着用者かを確かめる。

## シングルトン {#singletons}

| コントラクト | owner だけが呼べるもの | 誰でも呼べるもの |
| --- | --- | --- |
| BigBang | `set*`(Hats、モジュールの実装、factory)、アップグレード | `bigbang(...)`: ワークスペースを作る |
| SplitsCreatorFactory | `setImplementation`、`setBigBang`、アップグレード | `predictDeterministicAddress`(view)。`createSplitCreatorDeterministic` は `BigBang` しか呼べない。 |
| ThanksTokenFactory | `setImplementation`、`setHatsAddress`、`setBigBang`、アップグレード | `predictThanksTokenAddress`(view)。`createThanksToken` と `createThanksTokenDeterministic` は `BigBang` しか呼べない。 |
| ScheduledDistributorFactory | `setImplementation`、`setHats`、アップグレード | [ScheduledDistributor](./modules/scheduled-distributor.md) のページで定める予定。 |

## ワークスペースごとのコントラクト {#per-workspace-contracts}

| コントラクト | 規則 |
| --- | --- |
| SplitsCreator | `preview`、`create`、`createWithSalt` は誰でも呼べる。split を作っても資金は動かず、どの split に資金を送るかは支払う側が決める。[SplitsCreator の設計の理由](./modules/splits-creator.md#rationale)を参照。 |
| ThanksToken | `setAddressCoefficient` と `setAddressCoefficients` は、作成時に clone の引数に入れたワークスペースの owner(`bigbang` の `_owner`)しか呼べない。top hat の着用者とは連動しない。`mint`、`batchMint`、`approveMint`、`permitMint` と ERC-20 の関数は誰でも呼べる。mint できる量は上限の式で、`mintFrom` は許可量で制限される。[ThanksToken の仕組み](./modules/thanks-token.md#mechanism)を参照。 |
| HatsTimeFrameModule | `mintHat` と `batchMintHat` は、minter hat(BigBang が作る `minterHatId`)の admin か着用者だけが呼べる。`deactivate`、`reactivate`、`renounce` は、それに加えて対象の着用者本人も呼べる。view は誰でも呼べる。[HatsTimeFrameModule の原則](./modules/hats-time-frame-module.md#principles)の HTF-6 を参照。 |
| HatsFractionTokenModule | `mintInitialSupply`・`batchMintInitialSupply`・`mint`・`burn` は、対象のロールの admin か着用者が呼べる(着用者は、同じロールの他の着用者のシェアについても呼べる)。`burn` は、そのシェアを持つ任意のアカウントの残高を焼ける。送金は ERC-1155 のとおり、保有者本人か、保有者が承認した operator が行う。量 0 の送金は誰でもでき、受取人一覧にアドレスを加える。[HatsFractionTokenModule の既知の制約](./modules/hats-fraction-token-module.md#known-limitations)を参照。 |
| その他のモジュール | 各モジュールのページで定める予定。 |
