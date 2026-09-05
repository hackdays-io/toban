# `@toban/openclaw` (`pkgs/openclaw`)

[OpenClaw](https://docs.openclaw.ai/) ゲートウェイの **Fly.io デプロイ設定**。Discord に常駐して
Toban のワークスペースについて会話し、サンクス送付・クエスト申請の**下書き**を作り、
定期的に Goldsky を見て通知します。

**アプリケーションコードはここにありません。** 動くのは本家の公式イメージ
（`ghcr.io/openclaw/openclaw`）そのもので、自前ビルドもしません。このパッケージが
持つのは fly.toml / 設定テンプレート / エージェントへの指示書 / それらを組み立てる
スクリプトだけです。

## 構成

```
fly.toml                       Fly のアプリ定義（公式イメージ・ボリューム・常時 1 台）
config/
  openclaw.template.json       設定のテンプレート。**OpenClaw のスキーマはここが唯一の定義**
  guilds.example.json          ギルド一覧の書式サンプル
  guilds.json                  実運用の一覧（example をコピーして作る）
src/render-config.ts           テンプレート + ギルド一覧 -> openclaw.json、および検証
scripts/render-config.ts       上記の CLI
scripts/push-config.sh         レンダリング結果を /data/openclaw.json へ送る
scripts/deploy.sh              事前確認つきの fly deploy
instructions/TOBAN.md          エージェントへの指示書（各ワークスペースへ AGENTS.md として配置）
```

## なぜ設定がテンプレートなのか

`OPENCLAW_STATE_DIR=/data` なので、OpenClaw の設定の実体は **Fly のボリューム上の
`/data/openclaw.json`** です。`fly deploy` では入れ替わりません。リポジトリに素の
`openclaw.json` を置くと必ず実体と乖離するので、リポジトリ側はテンプレートに留め、
`push:config` のたびに組み立てて送り込みます。

同じ理由で、**automations（cron）の定義とその実行履歴もボリューム上の SQLite** にあります。
ボリュームを消すと設定とスケジュールの両方が消えます。

## コマンド

```
pnpm openclaw render:config              # dist/openclaw.json を書き出すだけ
pnpm openclaw push:config --dry-run      # 同上（送信しない）
pnpm openclaw push:config                # /data/openclaw.json へ送って再起動
pnpm openclaw deploy:fly                 # 事前確認 -> fly deploy
pnpm openclaw test                       # vitest
pnpm openclaw typecheck                  # tsc --noEmit
```

デプロイ手順は **`DEPLOYMENT.md` §7** を読んでください。ここには構成の説明しか書きません。

## 初回セットアップで詰まりやすいところ

実機で踏んだものだけ書いています。

- **ボリュームを先に作る。** 無いまま deploy すると、設定と automations の状態が再起動の
  たびに消えます。`deploy.sh` は事前に確認して止まります
- **`--allow-unconfigured` は消さない。** 設定の実体はボリューム上にあり、それを送り込む
  `push:config` は「動いているマシン」に ssh します。このフラグが無いと初回は
  「設定が無いと起動しない ↔ 起動していないと設定を送れない」で詰みます
  （gateway が exit 78 で 10 回再起動してマシンが停止し、ssh も入れなくなります）
- **不正な設定を置いたまま再起動しない。** 同じ詰み方をします。`push-config.sh` は
  送信後・再起動前にリモートで `openclaw config validate` を通し、落ちたら退避した
  設定へ戻して中断します。手で置いたときは自分で検証してください
- **ssh / sftp は root で走る。** 置いたファイルは root 所有になり、uid 1000 (node) で
  動く gateway が自分のワークスペースに書けなくなります。`push-config.sh` は配置後に
  `chown` します（`/data` 自体は Fly が uid/gid 1000 でマウントするので問題ありません）
- **Discord の Privileged Intents。** Message Content（必須）と Server Members を
  Developer Portal で有効化します
- **Fly の trial org ではデプロイできません。** リリース作成が 422 で拒否されます
  （`This functionality is disabled for trial organizations`）。クレジットカードの登録が要ります

## 設定を変えたとき

| 変えたもの | 必要な操作 |
|---|---|
| `instructions/` | `push:config`（各ワークスペースの `AGENTS.md` として送られる） |
| `config/*.json` | `push:config` |
| `fly.toml` | `deploy:fly` |
| イメージのバージョン | `fly.toml` の `[build] image` を書き換えて `deploy:fly` |
| ギルドを追加 | `config/guilds.json` に足して `push:config` |
