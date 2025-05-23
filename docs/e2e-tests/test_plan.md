# E2Eテスト実装計画: 主要ユーザーフロー

## 概要
Tobanアプリケーションの主要なユーザーフローをカバーするE2Eテストの実装計画です。このissueでは、実装すべき9つの主要テストケースを詳細に記述します。

## テストケース一覧

### 1. ワークスペース作成フロー
新しいワークスペースを作成する基本的なユーザーフローのテスト。
- ワークスペース作成ボタンのクリック
- フォーム入力（画像、名前、説明）
- **MetaMaskウォレットでの署名プロセス**
- 作成後の遷移と表示確認

### 2. 役割作成フロー
ワークスペース内で新しい役割を作成するフローのテスト。
- 役割追加ボタンのクリック
- フォーム入力（画像、名前、説明、タスク、権限）
- **MetaMaskウォレットでの署名プロセス**
- 作成後の表示確認

### 3. 役割割り当てフロー
作成した役割をメンバーに割り当てるフローのテスト。
- 「役割を渡す」ボタンのクリック
- ユーザー指定と開始日選択
- **MetaMaskウォレットでの署名プロセス**
- 割り当て後の表示確認

### 4. アシストクレジット送信フロー
メンバー間でアシストクレジットを送信するフローのテスト。
- 送信先ユーザー選択
- 送信量入力
- スワイプジェスチャーの実行
- **MetaMaskウォレットでの署名プロセス**
- 送信後の残高確認

### 5. アクティビティ履歴閲覧フロー
ワークスペース内のアクティビティ履歴を閲覧するフローのテスト。
- アクティビティリスト表示
- グラフ表示切替
- 期間フィルタリング

### 6. メンバー情報閲覧フロー
ワークスペース内のメンバー情報を閲覧するフローのテスト。
- メンバーリスト表示
- 役割とクレジット情報確認
- メンバー詳細表示

### 7. アシストクレジット残高確認フロー
ユーザーのアシストクレジット残高を確認するフローのテスト。
- クレジット一覧表示
- 残高と受け取り元確認
- 送信機能へのアクセス

### 8. スプリット作成フロー
報酬分配のためのスプリットを作成するフローのテスト。
- 分配係数設定
- 対象外設定
- プレビュー確認
- **MetaMaskウォレットでの署名プロセス**
- 作成後の表示確認

### 9. スプリット閲覧フロー
作成済みのスプリット情報を閲覧するフローのテスト。
- スプリット一覧表示
- 詳細情報展開
- 分配設定確認

## 技術的な実装ポイント

すべてのテストケースに共通する技術的な実装ポイント：

1. **TypeScriptの型安全性**
   - 適切な型定義の使用
   - 暗黙的な`any`型の排除

2. **ページオブジェクトパターン**
   - 各ページの操作をカプセル化したクラスの作成
   - テストコードの再利用性と保守性の向上

3. **待機戦略の改善**
   - 固定の待機時間を要素の状態に基づく待機に置き換え
   - `cy.wait()`の代わりに`cy.intercept()`と`cy.contains()`を使用

4. **テストの分割と整理**
   - 各テストの責任範囲を明確に
   - 前提条件の適切な設定

5. **環境変数の活用**
   - シードフレーズなどの機密情報を環境変数に移動
   - CI/CD環境での安全な管理

6. **MetaMaskウォレット連携**
   - Synpressを使用したウォレット操作の安定化
   - 署名プロセスの適切なテスト

## ウォレット署名が必要なフロー

以下のフローではMetaMaskウォレットでの署名プロセスのテストが必要です：

1. **ワークスペース作成フロー**
2. **役割作成フロー**
3. **役割割り当てフロー**
4. **アシストクレジット送信フロー**
5. **スプリット作成フロー**

これらのフローでは、Synpressを使用してMetaMaskウォレットとの連携と署名プロセスを適切にテストする必要があります。

## 優先順位

テストケースの実装優先順位：

1. ワークスペース作成フロー（基本機能）
2. 役割作成フロー（基本組織管理）
3. 役割割り当てフロー（基本組織管理）
4. アシストクレジット送信フロー（主要機能）
5. スプリット作成フロー（重要機能）
6. アシストクレジット残高確認フロー（情報確認）
7. アクティビティ履歴閲覧フロー（情報確認）
8. メンバー情報閲覧フロー（情報確認）
9. スプリット閲覧フロー（情報確認）

## 詳細な実装計画

各テストケースの詳細な実装計画は、このissueのコメントとして追加します。これには以下が含まれます：

- 具体的なテストステップ
- 期待される結果
- エッジケースの考慮
- 必要なモック/スタブ

## 関連リソース

- [既存のE2Eテスト](https://github.com/hackdays-io/toban/tree/main/pkgs/frontend/cypress)
- [Synpress ドキュメント](https://github.com/Synthetixio/synpress)
- [Cypress ベストプラクティス](https://docs.cypress.io/guides/references/best-practices)
