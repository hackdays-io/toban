---
name: ship
description: Toban の実装ループを最後まで回す — issue/依頼から受け入れ基準を決め、worktree で実装し、scripts/verify.sh が通るまで直し、セルフレビュー後にコミット・push・PR 作成、そのまま /pr-watch に引き継ぐ。「実装して PR まで」「この issue やって」「ship して」で使う。
---

# /ship — 実装から PR までの一本道

引数: issue 番号（`#123` / `123`）または作業内容の説明。

## 0. 起点を固める
1. issue 番号があれば `gh issue view <n> --comments` で本文とコメントを読む。
2. **受け入れ基準（Done の定義）を 3〜7 項目のチェックリストで書き出す。** 「何が見えたら終わりか」を、可能な限り機械的に判定できる形（テスト名・コマンド・画面上の挙動）で書く。曖昧なまま実装に入らない。ユーザーにしか決められない論点があればここで 1 回だけまとめて聞く。
3. 作業ディレクトリの確認: main チェックアウトの `main` ブランチ上なら、`EnterWorktree`（または `claude --worktree issue/<n>`）で worktree に移る。worktree は `origin/main` から切られる。

## 1. 実装ループ
- 触るパッケージの `AGENTS.md` を先に読む（ルート AGENTS.md の「Per-package guides」）。
- 3 層にまたがる変更（contract → subgraph → frontend）は依存順に進め、DEPLOYMENT.md の順序制約を守る。
- 小さく作って `scripts/verify.sh` を回す → 失敗を読む → 直す、を繰り返す。テストを消す・弱める・skip する形で通すのは禁止。
- 新しい純粋ロジックにはテストを足す（frontend / extensions は Vitest、contract は Hardhat）。
- 長い作業（複数セッションにまたがる）は早めに Draft PR を作り、PR 本文のチェックリストを進捗メモとして更新する。

## 2. 完了判定（全部満たすまで次に進まない）
- [ ] `scripts/verify.sh` が exit 0（Stop hook も同じものを強制する）
- [ ] 受け入れ基準を 1 つずつ確認し、根拠（実行したコマンドと結果、該当テスト）を言える
- [ ] UI 変更なら `/run` などで実際に画面を動かして確認した

## 3. セルフレビュー（作った本人と別の目で見る）
1. `/simplify` — 重複・冗長を先に潰す。
2. `toban-reviewer` サブエージェントに **差分だけ** を渡してレビューさせる（自分の結論は渡さない）。あわせて `/code-review` を使ってよい。
3. 指摘を直したら `scripts/verify.sh` をもう一度通す。
4. スコープ外の変更（ついでのリファクタ、別タスクの修正）が混じっていたら取り除く。

## 4. コミット → push → PR（確認を挟まずに進める）
1. `gh pr list --head <branch> --state all` で同じブランチの PR が merged / closed になっていないか確かめる。
2. コミットメッセージは既存の履歴に合わせる: `feat(frontend): 〜` / `fix(contract): 〜` など、scope 付きの短い日本語。
3. `git push -u origin <branch>`、`gh pr create --base main`。本文は `.github/PULL_REQUEST_TEMPLATE.md` に沿い、次を必ず入れる:
   - 変更の概要と理由、`Resolves #<n>`
   - 受け入れ基準のチェックリスト（確認済みのものに ✅）
   - 実行した検証（`scripts/verify.sh` の PASS 行を貼る）
   - デプロイへの影響（ABI 同期・subgraph の再デプロイ・codegen・Worker の順序・Turnkey policy・環境変数）。無ければ「なし」と書く
   - UI 変更があればスクリーンショット
4. Lefthook が落ちたら原因を直して新しいコミットを作る。`--no-verify` は使わない。

## 5. PR を見張る
PR 番号を添えて `/pr-watch <n>` を 1 回実行する。CI や reviewer の反応を待つ必要がある場合は `/loop /pr-watch <n>` で自走させる。

## 6. 書き戻す（compound）
この PR の作業中に起きたことのうち、次のどれかがあれば、二度と起きないようにする変更を **同じ PR に** 足す（別 PR にしない。教訓が PR と一緒にレビューされるように）:
- ユーザーに訂正された、言い直された、説明を求められた
- verify / CI / レビューで同じ種類の失敗が 2 回以上出た
- AGENTS.md に書いてあれば避けられた調べもの・試行錯誤をした

反映先は強制力の強い順に考える: hook → `verify.sh` / テスト → スキル / `toban-reviewer` → `AGENTS.md`（1〜2 行で短く）。その人だけの好みはリポジトリに入れず、個人メモリに保存してよいか聞く。何も無ければ何もしない（無理に書き足さない）。セッションをまたぐ傾向の分析は `/retro` で行う。

## 最後にユーザーへ報告すること
PR の URL、受け入れ基準ごとの結果、verify の結果、残ったリスクや手動で必要な作業（デプロイ・policy 更新など）、書き戻した教訓（あれば）。失敗が残っているならそのまま「失敗している」と書く。新しく作った仕組みやスキルがあれば、その使い方と人が何をすればいいかも書く。
