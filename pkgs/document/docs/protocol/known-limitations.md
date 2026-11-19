---
title: 既知の制約
sidebar_position: 5
---

# 既知の制約

## 検証の範囲 {#scope-of-verification}

- **対象は Toban 独自のロジックだけ。** [Hats Protocol](https://www.hatsprotocol.xyz/) と [0xSplits](https://splits.org/) は監査済みの外部コードである。モデル化はせず、その動作を前提として扱う。
- **検証は Solidity の言語仕様のレベルまで。** モデルは、uint256 の範囲と overflow での revert(Solidity 0.8 の checked arithmetic)を含めて、コントラクトのソースコードと同じ計算をする。コンパイラが生成したバイトコードが EVM の上でこのとおりに動くことは、差分テストで確かめているだけで、証明はしていない。`_sqrt` の途中の計算は、着用時間がどれだけ長くても 2^256 に届かないので、モデルでは `Nat.sqrt` として扱っている。差分テストで、両者の値が一致することを確かめている。
- **他のコントラクトから読む値は、モデルへの入力として扱う。** SplitsCreator のモデルは、残高・供給量・着用時間・エスクローを与えられた数として受け取る。`HatsFractionTokenModule.getTokenRecipients` が返す一覧は、空であるか、着用者を 1 回だけ含み、残りは互いに異なる他の保有者と、場合によってはクエストモジュールである、と仮定している。そのモジュールがこの形を保つかは、そのモジュール自身の仕様で扱う(まだ書いていない)。
- **fuzzed は、実装について証明したことにはならない。** 差分テストがコントラクトとモデルを比べているのは 183 件の入力で、すべての入力ではない。実装そのものの網羅的な検証(Halmos や Certora など)は、今のところ範囲外である。

## SplitsCreator {#splitscreator}

[SplitsCreator の既知の制約](./modules/splits-creator.md#known-limitations)を参照。
