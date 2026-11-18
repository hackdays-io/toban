---
name: pr-watch
description: 自分が作った Toban の PR を 1 周チェックして直す — conflict・CI・未解決のレビューコメントを確認し、修正 push・返信・resolve まで行う。`/loop /pr-watch <PR番号>` で、PR が緑になるまで自走させる用途。「PR 見張って」「CI 直して」「レビュー対応して」で使う。
---

# /pr-watch <PR番号> — PR の 1 周チェック

1 回の実行で以下を上から順に行う。直すべきものが見つかったら直して push し、その周は終える（次の周で結果を確かめる）。

## 1. 状態を取る
```bash
gh pr view <n> --json state,isDraft,mergeable,mergeStateStatus,headRefName,reviewDecision
```
- `MERGED` / `CLOSED` → 何もしない。**ループを止める**（`/loop` 中なら止める旨を報告して終える）。
- このセッションの作業ブランチと `headRefName` が違うときは、その worktree に移ってから作業する。

## 2. Conflict
`mergeable == CONFLICTING` なら `git fetch origin main && git rebase origin/main`（共有ブランチや他人のコミットがあるなら merge）。解消後に `scripts/verify.sh` を通し、`git push --force-with-lease`。

## 3. CI
`gh pr checks <n>`
- pending → 何もしない（次の周で見る）。
- fail → `gh run view <run-id> --log-failed` でログを読み、原因を直す。ローカルで再現できるなら再現してから直す。`scripts/verify.sh` → push。
- flaky に見えても、根拠なしで「flaky」と決めつけない。1 回だけ `gh run rerun --failed` してよいが、2 回目に落ちたら直す。

## 4. レビューコメント
未解決のスレッドを取る:
```bash
gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){reviewThreads(first:100){nodes{id isResolved isOutdated comments(first:20){nodes{databaseId author{login} body path line}}}}}}}' \
  -f o=hackdays-io -f r=toban -F n=<n>
```
`isResolved == false` のスレッドごとに:
1. 指摘が正しいかをコードで確かめる（レビュアーの指摘を鵜呑みにしない）。
2. 直すなら修正して push。直さないなら理由を書く。**どちらの場合も返信する**:
   ```bash
   gh api repos/hackdays-io/toban/pulls/<n>/comments -X POST -F in_reply_to=<databaseId> -f body='修正しました (<sha>)。<要約>'
   ```
3. 返信したスレッドを resolve:
   ```bash
   gh api graphql -f query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' -f t=<thread id>
   ```
   人間のレビュアーが「議論中」としているスレッドは resolve せず返信だけにする。
- PR 全体へのコメント（`gh pr view <n> --comments`）で質問されていれば、そこにも返信する。

## 5. 終了条件
次の全部を満たしたら「マージ可能」と報告し、`/loop` 中ならループを止める:
- conflict なし、すべての CI が success
- 未解決スレッドが 0（または人間の判断待ちのものだけ）

人間の判断が要るもの（仕様の選択、デプロイ、Turnkey policy の更新、secrets）は自分で進めず、PR にコメントしてユーザーに報告する。**マージは自分でしない。**
