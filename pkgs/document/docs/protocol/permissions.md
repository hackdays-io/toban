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
| ThanksTokenFactory | `setImplementation`、`setHatsAddress`、`setBigBang`、アップグレード | [ThanksToken](./modules/thanks-token.md) のページで定める予定。 |
| ScheduledDistributorFactory | `setImplementation`、`setHats`、アップグレード | [ScheduledDistributor](./modules/scheduled-distributor.md) のページで定める予定。 |

## ワークスペースごとのコントラクト {#per-workspace-contracts}

| コントラクト | 規則 |
| --- | --- |
| SplitsCreator | `preview`、`create`、`createWithSalt` は誰でも呼べる。split を作っても資金は動かず、どの split に資金を送るかは支払う側が決める。[SplitsCreator の設計の理由](./modules/splits-creator.md#rationale)を参照。 |
| その他のモジュール | 各モジュールのページで定める予定。 |
