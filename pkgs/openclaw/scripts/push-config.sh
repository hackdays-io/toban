#!/usr/bin/env bash
#
# レンダリングした設定と指示書を Fly のボリュームへ送り込む。
#
#   pnpm openclaw push:config [--dry-run]
#
# 設定の実体は /data/openclaw.json（ボリューム上）にあり、`fly deploy` では
# 入れ替わらない。設定・指示書を変えたときはこのスクリプトを流す。
#
# 送ったあと **再起動前に** リモートで `openclaw config validate` を通す。
# 不正な設定を置いたまま再起動すると gateway が exit 78 で再起動ループに入り、
# 10 回でマシンが停止して ssh も入れなくなる（実際に踏んだ）。検証に落ちたら
# 退避しておいた設定へ戻して中断する。
set -euo pipefail

cd "$(dirname "$0")/.."

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

APP="$(sed -n 's/^app *= *"\(.*\)"/\1/p' fly.toml | head -1)"
if [ -z "$APP" ]; then
  echo "✗ fly.toml から app 名を読めませんでした" >&2
  exit 1
fi

OUT="dist/openclaw.json"
MANIFEST="dist/agents.json"
REMOTE="/data/openclaw.json"
REMOTE_BAK="/data/openclaw.json.push-bak"

echo "→ 設定をレンダリング"
pnpm exec tsx scripts/render-config.ts --out "$OUT"

if [ "$DRY_RUN" = "1" ]; then
  echo "✓ dry-run。$OUT を書き出しただけで、$APP には送っていません"
  exit 0
fi

if ! command -v fly >/dev/null 2>&1; then
  echo "✗ fly CLI が見つかりません: https://fly.io/docs/flyctl/install/" >&2
  exit 1
fi

# 注意: `fly ssh console -C` はシェルを介さないので、`&&` や `;` は使えない。
# 単一コマンドの argv として書くこと。
# また flyctl はヘルスチェックが通っていないマシンを ssh 先として選ばない。
# 落ちているマシンを触るときは FLY_MACHINE=<id> を指定する。
FLY_MACHINE="${FLY_MACHINE:-}"
MACHINE_ARG=""
[ -n "$FLY_MACHINE" ] && MACHINE_ARG="--machine $FLY_MACHINE"
# shellcheck disable=SC2086
sftp() { fly ssh sftp shell --app "$APP" $MACHINE_ARG >/dev/null; }
# shellcheck disable=SC2086
remote() { fly ssh console --app "$APP" $MACHINE_ARG -C "$1"; }

# 上書き前に、いま動いている設定をリモートとローカルの両方へ退避する。
LOCAL_BAK="dist/openclaw.json.$(date -u +%Y%m%dT%H%M%SZ).bak"
if remote "cp $REMOTE $REMOTE_BAK" >/dev/null 2>&1 &&
   fly ssh console --app "$APP" -C "cat $REMOTE" > "$LOCAL_BAK" 2>/dev/null; then
  echo "→ 既存の設定を退避（リモート $REMOTE_BAK / ローカル $LOCAL_BAK）"
  HAVE_BAK=1
else
  rm -f "$LOCAL_BAK"
  echo "→ 既存の設定なし（初回とみなします）"
  HAVE_BAK=0
fi

echo "→ 指示書を各ワークスペースへ AGENTS.md として配置"
# agents.entries.<id>.instructions というキーは存在しない。ワークスペース直下の
# AGENTS.md がシステムプロンプトへ注入される仕組みなので、そこへ置く。
node -e '
  const m = require("./dist/agents.json");
  for (const a of m) if (a.workspace) console.log(a.workspace);
' | while read -r ws; do
  [ -z "$ws" ] && continue
  remote "mkdir -p $ws" >/dev/null
  printf 'put %s %s\n' "instructions/TOBAN.md" "$ws/AGENTS.md" | sftp
  echo "   $ws/AGENTS.md"
done
# ssh / sftp は root で走るので、置いたものは root 所有になる。gateway は uid 1000
# (node) で動くため、ワークスペースを root 所有のままにするとエージェントが自分の
# 作業ディレクトリに書けない。
remote "chown -R 1000:1000 /data/workspace" >/dev/null

echo "→ $APP:$REMOTE へ設定を送信"
printf 'put %s %s\n' "$OUT" "$REMOTE" | sftp
remote "chown 1000:1000 $REMOTE" >/dev/null

echo "→ リモートで設定を検証"
if ! remote "openclaw config validate"; then
  echo "✗ 設定がスキーマに合いません。再起動せずに中断します" >&2
  if [ "$HAVE_BAK" = "1" ]; then
    remote "cp $REMOTE_BAK $REMOTE" >/dev/null
    echo "  退避しておいた設定へ戻しました" >&2
  else
    remote "rm -f $REMOTE" >/dev/null
    echo "  送った設定を削除しました（--allow-unconfigured で起動します）" >&2
  fi
  exit 1
fi

# automations とチャンネル設定を確実に読み直させる。常時 1 台なので短い断が入る。
echo "→ ゲートウェイを再起動"
fly apps restart "$APP"

echo "✓ 完了。ログ: fly logs --app $APP"
