# Toban — Design Handoff Bundle

このディレクトリは [claude.ai/design](https://claude.ai/design) で作成したデザインプロトタイプのソースバンドルです。フロントエンドフルリニューアル（親 Issue: [#418](https://github.com/hackdays-io/toban/issues/418)）の **設計参照** として配置しています。

## ⚠️ 重要：これは「参考」であり、忠実に再現すべき仕様書ではありません

- `Toban Prototype.html`（モバイル）と `Toban Desktop.html`（デスクトップ）は **Claude Design による HTML/CSS/JS のプロトタイプ** です。実装の参考にはなりますが、**完全ではありません**。
- 特に **Desktop はレイアウトが崩れていたり、用途不明な要素が含まれていたり** します。それらは無視して構いません。
- プロトタイプの内部構造（どのコンポーネントをどう組んでいるか）を真似する必要はありません。**ビジュアル・トーン・UX の方向性** を参考にしつつ、Toban のフロントエンド側の流儀（Vite + React Router v7 + Shadcn + Tailwind + 独自デザインシステム）に落とし込むのが目的です。
- ロジック・状態管理・データ構造はモックなので、実装ではすべて差し替わります。

## ブラウザでプレビュー

HTML は CDN 経由で React/Babel を読み込むので、ファイルを直接開けば動きます。ビルドは不要です。

```bash
# シンプル：ファイルを直接開く（OS依存）
open "docs/design/handoff/project/Toban Prototype.html"
open "docs/design/handoff/project/Toban Desktop.html"

# またはローカルサーバー経由（推奨：CORS まわりが安定）
cd docs/design/handoff/project && python3 -m http.server 8080
# → http://localhost:8080/Toban%20Prototype.html
# → http://localhost:8080/Toban%20Desktop.html
```

## ファイル一覧

### `project/` — プロトタイプソース

| ファイル | 内容 |
| --- | --- |
| `Toban Prototype.html` | モバイルプロトタイプのエントリ（402px iOS フレーム）— 参考用、完全ではない |
| `Toban Desktop.html` | デスクトッププロトタイプのエントリ（1280px Sidebar+TopBar）— 参考用、完全ではない |
| `tokens.js` | **デザイントークン（color / radius / space / shadow / font）** — 実装で正の出典として扱う |
| `data.js` | モックデータ（`window.TOBAN_DATA`） |
| `primitives.jsx` | プリミティブ（Button / Card / Avatar / Badge / Input / Sheet / BottomNav 等）— **コンポーネント API の参考** |
| `screens.jsx` | モバイル各画面：Home / Duties / Splits / Members / Wallet / Thanks 送信フロー / Workspace 一覧 |
| `edit-screens.jsx` | Duty 作成・編集、Workspace 作成・編集 |
| `quests.jsx` | クエスト機能（一覧 / 詳細 / 作成 / 承認）+ シェア分布バー |
| `thanks-insights.jsx` | サンクスのデータ可視化（リスト / Treemap / フレンドシップ） |
| `desktop.jsx` | デスクトップ用の Sidebar / TopBar / 各画面 — レイアウト崩れあり、参考程度に |
| `app.jsx` | モバイルアプリのルート（ルーティング・Sheet 制御） |
| `ios-frame.jsx` | iOS デバイスフレーム表示（実装には不要） |

### `chats/`

| ファイル | 内容 |
| --- | --- |
| `chat1.md` | デザイン作成時の対話ログ。**「カードの左縁がカラーになるのが嫌い」「PCレイアウトを作りたい」** など、設計意図・なぜこうしたかが残っている。実装判断に迷ったら参照する価値あり。 |

## 実装で**忠実に**従うべきもの

- **`tokens.js` のカラー・radius・shadow・font** — そのまま Tailwind v4 の `@theme` に展開（[#426](https://github.com/hackdays-io/toban/issues/426) で対応）
- **コピー方針**：Login → ウォレット接続、Hat/Role → 当番、Splits → 分配、Thanks → サンクス（THX）
- **ナビゲーション**：モバイル BottomNav（ホーム / 当番 / 分配 / メンバー / ウォレット）、デスクトップ Sidebar+TopBar
- **`primitives.jsx` の各プリミティブの API・variants**

## 実装で**従わなくて良い**もの

- HTML/JSX の DOM 構造そのまま（実装は Shadcn / Tailwind ベースに置き換わる）
- インラインスタイル（実装では Tailwind クラスへ）
- アイコン SVG（lucide-react に置き換え、[#421](https://github.com/hackdays-io/toban/issues/421)）
- Desktop プロトタイプの不自然なレイアウト崩れ・用途不明な要素

## 各 Issue からの参照

各子 Issue の本文には、対応する設計ソースの該当箇所（例：`screens.jsx:6-85` の `HomeScreen`）を引用しています。実装時はそこから本ディレクトリのファイルを開いてください。
