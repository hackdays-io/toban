# `@toban/openclaw` (`pkgs/openclaw`)

[OpenClaw](https://docs.openclaw.ai/) ゲートウェイの **Fly.io デプロイ設定**。Discord に常駐して
Toban のワークスペースについて会話し、サンクス送付・クエスト申請の**下書き**を作り、
定期的に Goldsky を見て通知します。

**アプリケーションコードはここにありません。** 動くのは本家の公式イメージで、この
パッケージが持つのは fly.toml / Dockerfile / 設定テンプレート / エージェントへの
指示書 / それらを組み立てるスクリプトだけです。

## 構成

```
Dockerfile                     公式イメージ + instructions/ の焼き込み
fly.toml                       Fly のアプリ定義（ボリューム・常時 1 台・ヘルスチェック）
config/
  openclaw.template.json       設定のテンプレート。**OpenClaw のスキーマはここが唯一の定義**
  guilds.example.json          ギルド一覧の書式サンプル
  guilds.json                  実運用の一覧（example をコピーして作る）
src/render-config.ts           テンプレート + ギルド一覧 -> openclaw.json、および検証
scripts/render-config.ts       上記の CLI
scripts/push-config.sh         レンダリング結果を /data/openclaw.json へ送る
scripts/deploy.sh              事前確認つきの fly deploy
instructions/TOBAN.md          エージェントへの指示書（イメージに焼き込まれる）
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

- **ボリュームを先に作る。** 無いまま deploy すると、設定と automations の状態が再起動の
  たびに消えます。`deploy.sh` は事前に確認して止まります
- **ボリュームの所有者。** イメージは非 root で動きます。`/data` に書けない場合は
  ボリュームの所有者を確認してください（Fly のボリュームは既定で root 所有）
- **Discord の Privileged Intents。** Message Content（必須）と Server Members を
  Developer Portal で有効化します
- **`openclaw config schema` でテンプレートを検証する。** 本家のスキーマは更新で変わります。
  `config/openclaw.template.json` が唯一のスキーマ定義なので、キー名が変わったら
  ここを直せば済みます（TypeScript の修正は不要）

## 設定を変えたとき

| 変えたもの | 必要な操作 |
|---|---|
| `instructions/` | `deploy:fly`（イメージに焼き込まれているため） |
| `config/*.json` | `push:config` |
| `fly.toml` / `Dockerfile` | `deploy:fly` |
| ギルドを追加 | `config/guilds.json` に足して `push:config` |
