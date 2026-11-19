---
title: 既知の制約
sidebar_position: 5
---

# 既知の制約

## 検証の範囲 {#scope-of-verification}

- **対象は Toban 独自のロジックだけ。** [Hats Protocol](https://www.hatsprotocol.xyz/) と [0xSplits](https://splits.org/) は監査済みの外部コードである。モデル化はせず、その動作を前提として扱う。
- **モデルとコントラクトの対応は、証明ではなくテストで確かめている。** uint256 のモデル(`Contract.lean`)は、Solidity のソースコードを、uint256 の範囲と overflow での revert(Solidity 0.8 の checked arithmetic)も含めて手で写したものである。証明でつないでいるのは、原則と 2 つの Lean モデルのあいだだけである。モデルが Solidity のソースと同じ計算をすること、コンパイラが生成したバイトコードが EVM の上でそのとおりに動くことは、どちらも差分テストの入力で確かめているだけである。`_sqrt` の途中の計算は、uint256 のどの値でも 2^256 に届かないので、モデルでは `Nat.sqrt` として扱っている。両者の値が一致することは、2^256 − 1 までの着用時間を含む差分テストで確かめている。
- **他のコントラクトから読む値は、モデルへの入力として扱う。** SplitsCreator のモデルは、残高・供給量・着用時間・エスクローを与えられた数として受け取る。`HatsFractionTokenModule.getTokenRecipients` が返す一覧は、空であるか、着用者を 1 回だけ含み、残りは互いに異なる他の保有者と、場合によってはクエストモジュールである、と仮定している。そのモジュールがこの形を保つかは、そのモジュール自身の仕様で扱う(まだ書いていない)。
- **fuzzed は、実装について証明したことにはならない。** 差分テストがコントラクトとモデルを比べているのは 184 件の入力で、すべての入力ではない。実装そのものの網羅的な検証(Halmos や Certora など)は、今のところ範囲外である。

## SplitsCreator {#splitscreator}

[SplitsCreator の既知の制約](./modules/splits-creator.md#known-limitations)を参照。
