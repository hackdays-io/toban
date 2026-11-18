# toban

[![Test Contracts](https://github.com/hackdays-io/toban/actions/workflows/test-contract.yml/badge.svg)](https://github.com/hackdays-io/toban/actions/workflows/test-contract.yml)

[![Build Frontend(Vite + Remix)](https://github.com/hackdays-io/toban/actions/workflows/build-frontend.yml/badge.svg)](https://github.com/hackdays-io/toban/actions/workflows/build-frontend.yml)

[![Deploy document to GitHub Pages](https://github.com/hackdays-io/toban/actions/workflows/deploy-document.yml/badge.svg)](https://github.com/hackdays-io/toban/actions/workflows/deploy-document.yml)

![](./assets/header.png)

## About This Project

Toban is a simplest way to record contribution and distribute rewards.

Projects that involve a diverse people, such as open source development, collaborative works by multiple creators, and volunteer activities, and in which the people involved change one after another, can be very exciting, but they also have their own unique difficulties.

For example

- Annoying to Track Works:
  - It's very tedious to report what you've accomplished for each task
  - Nobody are running a community to measure contributions by weighting each task.
  - We always forget anyway lol
- Rewards are required for Long term Contribution
  - There is no long-term contribution, just a volunteer spirit
  - There is no money to give out of the blue, and no one starts because of money.
  - Someone needs to do the housework and chores
- Ladder for Onboarding to the Community
  - Few people can participate on their own
  - It is difficult to understand the community enough to actually be able to do something
  - It's important to have a starting point that makes it easy to contribute something

Therefore, we created Role Based Rewards Distribution system to track contributions and distribute rewards by role.

Core features are

1. Manage responsibilities and rights on roles
2. Track little contributions with P2P token transfer
3. Send Thanks Token(*)
4. Determine the rewards rate based on role and engaged period, and Fraction Token
5. Distribute rewards quickly to a large number of people

(*) In the implementation, what we refer to as a "Thanks Token" may also be called a "Fraction Token." In the application interface, it might appear as "Assist Credit" or "Role Share," depending on the version. However, all of these terms refer to the same concept.

These solutions were combined with ideas from [Hats Protocol](https://www.hatsprotocol.xyz/), [Splits](https://splits.org), and [Protocol Guild](https://protocol-guild.readthedocs.io/en/latest/).




## Live

[https://toban.xyz](https://toban.xyz/)

## Document

[GitHub Pages Toban](https://hackdays-io.github.io/toban/)

## Slide

[Canva - Toban](https://www.canva.com/design/DAGOcvbwfFk/yKhJwHvZ9sC69AFEb0vnRg/view?utm_content=DAGOcvbwfFk&utm_campaign=designshare&utm_medium=link&utm_source=editor)

## Demo Video

[here - Youtube](https://www.youtube.com/watch?v=jFjxNSHiCBI)

## Related Contract Addresses

> **一次情報は `pkgs/contract/outputs/contracts-<net>.json`** です（デプロイスクリプトが自動更新）。
> 下表は参考用のスナップショットで、デプロイのたびに古くなります。
> デプロイ手順は **[DEPLOYMENT.md](./DEPLOYMENT.md)** を参照。

### Sepolia

| ContractAddress | Name | Memo |
| --- | --- | --- |
| 0x010329e42cAc221D799C105516830D84901Dc2Ac | BigBang | **Toban のエントリポイント** |
| 0x84988CD2DdaC2137C9DF6b679341F0F180D9aaf2 | HatsQuestModule |  |
| 0x7fa6c0F8e4412ED72Ded8d591ABF58B276A992C9 | HatsTimeFrameModule |  |
| 0x830B6E01bf0d90941c756Ce3d9A24bC6FDCFbAb1 | SplitsCreatorFactory |  |
| 0x3a961240Ae4c01b15170940D2EDfAceCa996f2D8 | SplitsCreator |  |
| 0xa52E399Bc54f7CeB9d74784dC5D6289B7d970d1C | ThanksTokenFactory |  |
| 0x9eE2641Ba7017C63161C5682F077ab95E6C3eC0D | ScheduledDistributorFactory |  |
| 0xd6031f9543bEB0963e32CA2AC474de69D0515059 | FractionToken |  |
| 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137 | Hats | 外部プロトコル（全チェーン共通） |
| 0x0a3f85fa597B6a967271286aA0724811acDF5CD9 | HatsModuleFactory | 外部プロトコル（全チェーン共通） |
| 0x80f1B766817D04870f115fEBbcCADF8DBF75E017 | PullSplitsFactory | 外部プロトコル（全チェーン共通） |

### Base

| ContractAddress | Name | Memo |
| --- | --- | --- |
| 0xda7BFDb08e09Bb3ba0bC8e37c5c322328E458003 | BigBang | **Toban のエントリポイント** |
| 0x7fa6c0F8e4412ED72Ded8d591ABF58B276A992C9 | HatsTimeFrameModule |  |
| 0x01e7fb1De0919c9743C5a93806CB957214D0d4cC | SplitsCreatorFactory |  |
| 0xbEDa908672b45ce6dd6a5a9461d5e83f03F27C9F | SplitsCreator |  |
| 0xa183E2C368B2BdDf14cE1C29Dfd23cFE2F7c1280 | ThanksTokenFactory |  |
| 0x90b04bCfa471d9642e12667a5a07094A8f165AdE | ScheduledDistributorFactory |  |
| 0x3bc1A0Ad72417f2d411118085256fC53CBdDd137 | Hats | 外部プロトコル（全チェーン共通） |
| 0x0a3f85fa597B6a967271286aA0724811acDF5CD9 | HatsModuleFactory | 外部プロトコル（全チェーン共通） |
| 0x80f1B766817D04870f115fEBbcCADF8DBF75E017 | PullSplitsFactory | 外部プロトコル（全チェーン共通） |

## Deploy

コントラクト / インデクサー / フロントエンド / Cloudflare Workers / Turnkey / Discord は
一列に依存しており、順序を間違えると壊れます。**必ず
[DEPLOYMENT.md](./DEPLOYMENT.md)** の手順に従ってください。

```
contract → sync:abis → subgraph → frontend(codegen)
                    ↘ Turnkey policy
   Cloudflare: identity Worker → discord-bot Worker → Discord
```

- 全レイヤーの手順書: **[DEPLOYMENT.md](./DEPLOYMENT.md)**
- つまづきポイント集: [deploy-base-production.md](./pkgs/extensions/discord-bot/docs/deploy-base-production.md)

## How to work

- ### **setUp**

  - #### **frontend**

    `pkgs/frontend/.env`（Sepolia）を `.env.example` からコピーして値を埋めます。
    Base で動かす場合は `.env.base`（`pnpm frontend dev:base` が読みます）。

    ```bash
    cp pkgs/frontend/.env.example pkgs/frontend/.env
    ```

    **コントラクトアドレスは上の [Related Contract Addresses](#related-contract-addresses)
    ではなく、`pkgs/contract/outputs/contracts-<net>.json` を一次情報として埋めてください。**
    変数の一覧と役割は [`pkgs/frontend/README.md`](./pkgs/frontend/README.md#環境変数) にあります。

  - #### **smartcontract**

    `pkgs/contract/.env` を `.env.example` からコピーして値を埋めます。
    **テストネットと本番で鍵が別**である点に注意してください。

    ```bash
    cp pkgs/contract/.env.example pkgs/contract/.env
    ```

    ```txt
     PRIVATE_KEY=""             # Sepolia / Holesky
     PRODUCTION_PRIVATE_KEY=""  # Base（本番・別鍵）
     ALCHEMY_API_KEY=""
     ETHERSCAN_API_KEY=""       # Sepolia / Holesky
     BASESCAN_API_KEY=""        # Base
     COINMARKETCAP_API_KEY=""
     GAS_REPORT=
     HATS_ADDRESS=""
     HATS_MODULE_FACTORY_ADDRESS=""
     PULL_SPLITS_FACTORY_ADDRESS=""
    ```

  - #### **install**

    ```bash
    pnpm install
    ```

- ### whitepaper(Docusaurus)

  - #### build

    ```bash
    pnpm document build
    ```

  - #### start

    ```bash
    pnpm document start
    ```

- ### subgraph

  - #### **goldsky login**

    ```bash
    goldsky login
    ```

  - #### **deploy subgraph to sepolia**

    ```bash
    pnpm subgraph prepare:sepolia
    pnpm subgraph codegen
    pnpm subgraph build
    pnpm subgraph deploy:sepolia
    ```

- ### frontend

  - #### **build frontend**

    ```bash
    pnpm frontend build
    ```

  - #### **start frontend**

    ```bash
    pnpm frontend dev
    ```

- ### contract

  - #### **compile**

    ```bash
    pnpm contract compile
    ```

  - #### **test**

    ```bash
    pnpm contract test
    ```

  - #### **coverage**

    ```bash
    pnpm contract coverage
    ```

  - #### **clean**

    ```bash
    pnpm contract clean
    ```

  - #### **get Balance of address**

    ```bash
    pnpm contract getBalance --network sepolia
    ```

  - #### **get chaininfo**

    ```bash
    pnpm contract getChainInfo --network sepolia
    ```

  - #### **deploy all contract**

    ```bash
    pnpm contract deploy:all --network sepolia
    ```

  - #### **upgrade BigBang contract**

    ```bash
    pnpm contract upgrade:BigBang --network sepolia
    ```

  - #### **upgrade FractionToken Contract**

    ```bash
    pnpm contract upgrade:FractionToken --network sepolia
    ```

  - #### **get deployed contract address**

    ```bash
    pnpm contract getContractAddress --contract BigBang --network sepolia
    ```

  - #### **resiger new subdomain to `toban.eth`**

    ```bash
    pnpm contract registerSubdomain --label <your label> --network sepolia
    ```

  - #### **call bigbang task**

    ワークスペースを作成する際に実行されるメソッド.
    必要なコントラクトが一式デプロイされる

    ```bash
    pnpm contract bigbang \
    --owner 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072 \
    --tophatdetails "Dev Top Hat" \
    --tophatimageuri "dev-tophat" \
    --hatterhatdetails "Dev Hatter Hat" \
    --hatterhatimageuri "dev-hatterhat" \
    --memberhatdetails "Dev Member Hat" \
    --memberhatimageuri "dev-memberhat" \
    --network sepolia
    ```

  - #### **call getWoreTime task**

    ```bash
    pnpm contract getWoreTime --wearer 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072 --network sepolia
    ```

  - #### **call mintHat task**

    ```bash
    # --module には bigBangコントラクトの時に出力される hatsTimeFrameModule のアドレスを当てはめること！
    pnpm contract mintHat --hatid 39145842972085145413893403125858635166881967613628980006401871953526784 --wearer 0xEef377Bdf67A227a744e386231fB3f264C158CDF --module 0xA193a4CE929168A594744A53Fb17Ba4caBb507a4 --network sepolia
    ```

  - #### **call batchMintHats task**

    ```bash
    # --module には bigBangコントラクトの時に出力される hatsTimeFrameModule のアドレスを当てはめること！
    pnpm contract batchMintHat --hatid 39145842972085145413893403125858635166881967613628980006401871953526784 --csv ./data/example-wearers.csv --module 0xA193a4CE929168A594744A53Fb17Ba4caBb507a4 --network sepolia
    ```

## Development with Claude Code (worktree)

`.claude/settings.json` に `WorktreeCreate` / `WorktreeRemove` フックを登録済みです。`claude --worktree <name>` 一発で issue ごとに独立した作業環境を立ち上げ、PR 作成まで進められます。

### Quick reference

| 操作 | コマンド |
| --- | --- |
| worktree を作成して Claude セッション起動 | `claude --worktree issue/xxx` |
| worktree 一覧 | `git worktree list` |
| PR 作成 (リモート main 向け) | `gh pr create --base main` |
| セッション終了 (フックで worktree も削除) | Claude セッション内で `/exit` |

### 1. worktree を作成して Claude を起動

別ペイン（tmux/VS Code split など）で実行:

```bash
claude --worktree issue/xxx
```

`WorktreeCreate` フックが `scripts/claude-worktree-create.sh` を起動し、以下を実行します:

1. `.claude/worktrees/issue/xxx/` に worktree を作成 (ブランチ名: `worktree-issue/xxx`)
2. `pkgs/{contract,frontend}/.env` と `.claude/settings.local.json` を main repo からコピー
3. `pnpm install --frozen-lockfile`
4. `pnpm contract compile` (hardhat compile)

frontend で生成された GraphQL 型 (`pkgs/frontend/gql/`) はリポジトリにコミット済みなので、codegen は worktree 作成時に走らせません。スキーマ更新が必要なときだけ手動で `pnpm frontend codegen` を実行してください。

bootstrap ログは `.claude/worktrees/issue/xxx/.worktree-setup.log` に出力されます。

デフォルトでは `origin/main` を fetch してそこから分岐します（無関係なローカルコミットが PR に混ざらないように）。別ブランチの上に積みたい場合:

```bash
TOBAN_WORKTREE_BASE_REF=HEAD claude --worktree issue/xxx
```

### 自走ループ（実装 → 検証 → PR → CI/レビュー対応）

エージェント向けのルールは [`AGENTS.md`](./AGENTS.md) の「Required workflow」にまとまっています。Claude Code では次の仕組みで強制・自動化しています。

| 仕組み | 役割 |
| --- | --- |
| `scripts/verify.sh` | 変更のあったパッケージだけ Biome / typecheck / test / build を回す完了判定（`--list` で計画表示、`--all` で全部） |
| Stop hook (`.claude/hooks/stop-verify.sh`) | コード変更があり `verify.sh` が失敗している間は、失敗内容を渡して作業を続けさせる（最大 3 回。`TOBAN_SKIP_STOP_VERIFY=1` で無効化） |
| PreToolUse hook (`.claude/hooks/guard-main-checkout.sh`) | main チェックアウトが `main` ブランチのときのファイル編集を拒否 |
| `/ship <issue>` | 受け入れ基準の明文化 → 実装 → verify → セルフレビュー → PR 作成 |
| `/pr-watch <PR>` | conflict・CI・未解決レビューを 1 周見て直す。`/loop /pr-watch <PR>` で緑になるまで自走 |
| `toban-reviewer` サブエージェント | 差分を別の目で読む読み取り専用レビュアー（層をまたぐ不変条件をチェック） |
| `/retro [日数]` | セッション記録（`scripts/retro-signals.mjs`）と PR レビューを文脈ごと読んで摩擦を見つけ、hook / verify / スキル / AGENTS.md への改善を PR にする。週 1 回を想定 |

```bash
claude --worktree issue/123
> /ship #123
```

### 人間の開発者の役割

ループが回っている間、エージェントは「決められた Done に向かって実装し、検証を通し、PR を整える」ところまでを担当します。人間は **何を作るかを決め、ループの外側の判断をし、ループ自体を改善する** 役割を持ちます。

#### 1. 依頼する前: issue を「ループできる形」で書く
エージェントの成果物の質は、issue に書かれた完了条件の質でほぼ決まります。

- issue テンプレートの **Requirements** を受け入れ基準として書く。「何が見えたら終わりか」を、テスト・コマンド・画面上の挙動で判定できる形にする。
  - ✗「分配画面を使いやすくする」
  - ○「分配作成フォームで説明欄が 200 文字を超えたらエラーを出し、送信ボタンを無効にする」
- 仕様上の選択肢があるなら、issue の時点で決めておく。決めていなければ、`/ship` の最初の質問にまとめて答える（ここで答えた内容が以降の判断の基準になる）。
- 1 issue = 1 PR に収まる大きさに切る。大きいものは親 issue と子 issue に分ける。
- 機械的に判定できない作業（文章の推敲、デザインの方向性決め）はループに向かない。人間が方向を決めてから、検証できる部分だけを任せる。

#### 2. 任せている間: 張り付かない、ただし質問には答える
- 依頼したら基本は待つだけでよい。独立した issue なら、worktree を分けて複数並行で走らせられる。
- エージェントが止まって質問してきたら、それはエスカレーション（同じチェックが 3 回失敗した、仕様の判断が要る、スコープが issue を超えた、デプロイが要る）。判断して返す。
- 方向が違うと気づいたら早めに止めて、受け入れ基準を直してからやり直させる。間違った方向でループを回し続けても、良い結果にはならない。

#### 3. PR が来たら: 人間がレビューしてマージする
エージェントは自分ではマージしません。マージは人間の責任です。`verify.sh` と `toban-reviewer` が機械的な確認はしているので、人間は次の点に集中します。

- **受け入れ基準が意図どおりか**: PR 本文のチェックリストを、issue の意図と照らす。「テストは通るが求めていたものと違う」は、人間にしか見つけられない。
- **デプロイへの影響**: PR 本文の「デプロイへの影響」欄を確認し、必要な作業（ABI 同期、subgraph の再デプロイ、Worker のデプロイ順、Turnkey policy の更新、環境変数の追加）を誰がいつやるか決める。
- **UI/UX とプロダクト判断**: スクリーンショットや Vercel のプレビューで実際に触る。
- **スコープ**: issue と関係ない変更が混ざっていないか。

レビューコメントの書き方:
- 指摘は **行コメント（スレッド）** で書く。`/pr-watch` はスレッド単位で「修正して返信 → resolve」する。
- 修正してほしいのか、質問や議論なのかをはっきり書く。議論中のスレッドは「議論中」と書けば、エージェントは返信だけして resolve しない。
- コメントしたら、そのセッションで `/pr-watch <PR番号>` を実行する（またはエージェントを `/loop /pr-watch <PR番号>` で回しておく）。

#### 4. 人間だけがやること
- マージ
- デプロイ（コントラクト、subgraph、Cloudflare Workers、Fly）。手順は [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- secrets・`.env` の値・Turnkey policy の変更
- オンチェーントランザクションの実行
- 仕様・優先順位の決定

#### 5. ループを育てる
同じ種類の指摘を 2 回したら、それはルールが足りていないサインです。レビューで直させて終わりにせず、仕組みに反映してください。

エージェント側も自分で書き戻します。`/ship` は PR ごとに、その作業で訂正されたことや繰り返した失敗を同じ PR の中で仕組みに反映します。`/retro` は、手元の Claude Code のセッション記録を読み、セッションをまたぐ傾向を改善案の PR にします。

`/retro` は単語で判定しません。「違う」「とりあえず」のような単語で拾うと、口癖を摩擦と誤解してしまうからです。`retro-signals.mjs` が抜き出すのは事実だけです（作業中に送ったメッセージ、止めた・拒否した操作、言い直し）。それを **直前にエージェントが言ったこと・していたことと並べて**、その人の普段の言い方を基準に、文脈で判断します。判断に迷うものは最大 5 件まで本人に確認し、分かった言い方の傾向は個人メモリに残すので、回を重ねるほど誤判定が減ります。

人間がやることは次の 4 つです。

- **週 1 回 `/retro` を回す**（`/schedule` で定期実行にしてもよい）。セッション記録は各自のマシンにしかないので、エージェントをよく使う人が回す。
- **`/retro` の確認の質問に答える**。「これは摩擦でしたか？」と聞かれたら、違うなら違うと答える。口癖として覚えさせるのが目的なので、遠慮はいらない。
- **`/retro` の PR をレビューする**。根拠（どの出来事から来たか）が付いているので、それが本当にルールにすべきことかを判断する。
- **その場で言い直すときは、一言理由を添える**。「表にしないで（ターミナルで読みにくいので）」のように書くと、振り返りで個人の好みなのかチームのルールなのかを区別しやすい。

セッション記録には自分の発言がそのまま入っています。`retro-signals.mjs` の出力は手元で読むためのもので、PR や issue に原文を貼らないでください（`/retro` は要約だけを使います）。

| 何度も起きること | 反映する先 |
| --- | --- |
| 機械的に判定できるミス（型・lint・テスト漏れ） | テストを追加する、lint ルールを足す、パッケージの `verify` スクリプトに組み込む |
| 層をまたぐ同期漏れ・不変条件の違反 | `.claude/agents/toban-reviewer.md` のチェック項目 |
| 設計・規約の判断 | 該当パッケージの `AGENTS.md` |
| 手順の抜け（PR 本文、レビュー対応） | `.claude/skills/ship` / `pr-watch` |

- ルールは `AGENTS.md` に書き、`CLAUDE.md` は編集しない（`@AGENTS.md` の 1 行だけ）。
- 「書いてあるのに守られない」ルールは、文章を強くするより hook や `verify.sh` で強制する方が確実。
- パッケージを追加するときは `AGENTS.md` の「Adding a workspace package」に従う。漏れは `verify.sh` が検知する。

#### 6. 自分の手でコードを書くとき
人間が直接書く場合も、ルールは同じです。

- `main` で直接作業しない。worktree かフィーチャーブランチを使う。
- push する前に `scripts/verify.sh` を通す（CI も同じものを実行する）。
- `--no-verify` を使わない。テストを消したり弱めたりして通さない。
- Claude Code を調べもの目的だけで使うときなど、Stop hook の検証が邪魔なら `TOBAN_SKIP_STOP_VERIFY=1 claude` で起動する。

### 2. 編集 → コミット

worktree 内で通常どおり開発します。Claude セッションは worktree の中で起動しているので、Claude に依頼してそのまま編集 / コミットさせて構いません。手動の場合:

```bash
cd .claude/worktrees/issue/xxx
git add -A
git commit -m "feat: ..."
```

メインリポジトリと同じ lefthook の pre-commit (staged ファイルへの biome と、それを含むパッケージの typecheck) が走ります。

### 3. リモート main 向け PR を作成

```bash
# Claude セッション内、または worktree ディレクトリで
git push -u origin worktree-issue/xxx
gh pr create --base main --title "<PR title>" --body "Closes #xxx"
```

Claude に「PR を作って」と頼めば push と `gh pr create` まで自動化されます。

### 4. worktree を終了・削除

Claude セッション内で `/exit` すると `WorktreeRemove` フック (`scripts/claude-worktree-remove.sh`) が発火し、worktree とローカルブランチが自動で削除されます。

セッション外から手動で片付ける場合:

```bash
git worktree remove .claude/worktrees/issue/xxx
git branch -D worktree-issue/xxx
git push origin --delete worktree-issue/xxx  # リモート追跡ブランチも消す場合
```

### Tips

- **並行作業**: `claude --worktree issue/aaa` と `claude --worktree issue/bbb` を別ペインで同時起動。各 worktree は独立した `node_modules` と `.env` を持つので衝突しません。
- **bootstrap 失敗は非ブロッキング**: `pnpm install` や `pnpm contract compile` が落ちても worktree 自体は作成完了。`.worktree-setup.log` を確認してください。
- **gitignore 済み**: `.claude/worktrees/` と `.claude/settings.local.json` はリポジトリ管理外。`.claude/settings.json` (チーム共有のフック設定) と `scripts/claude-worktree-*.sh` のみコミット対象です。
