---
title: 既知の制約
sidebar_position: 5
---

# 既知の制約

## 検証の範囲 {#scope-of-verification}

- **対象は Toban 独自のロジックだけ。** [Hats Protocol](https://www.hatsprotocol.xyz/) と [0xSplits](https://splits.org/) は監査済みの外部コードである。モデル化はせず、その動作を前提として扱う。
- **モデルの整数には上限がない。** Lean の `Nat` はオーバーフローしないが、Solidity の `uint256` はオーバーフローすると revert する。原則がコントラクトで成り立つのは、途中の積がオーバーフローしない範囲である。現実的な入力は、この上限を大きく下回る。
- **他のコントラクトから読む値は、モデルへの入力として扱う。** SplitsCreator のモデルは、残高・供給量・着用時間・エスクローを与えられた数として受け取る。`HatsFractionTokenModule.getTokenRecipients` が返す一覧は、空であるか、着用者を 1 回だけ含み、残りは互いに異なる他の保有者と、場合によってはクエストモジュールである、と仮定している。そのモジュールがこの形を保つかは、そのモジュール自身の仕様で扱う(まだ書いていない)。
- **fuzzed は、実装について証明したことにはならない。** 差分テストがコントラクトとモデルを比べているのは 173 件の入力で、すべての入力ではない。実装そのものの網羅的な検証(Halmos や Certora など)は、今のところ範囲外である。

## SplitsCreator {#splitscreator}

[SplitsCreator の既知の制約](./modules/splits-creator.md#known-limitations)を参照。
