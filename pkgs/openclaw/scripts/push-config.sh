#!/usr/bin/env bash
#
# レンダリングした openclaw.json を Fly のボリュームへ送り込む。
#
#   pnpm openclaw push:config [--dry-run]
#
# 設定の実体は /data/openclaw.json（ボリューム上）にあり、`fly deploy` では
# 入れ替わらない。設定を変えたときはこのスクリプトを別途流す。
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
REMOTE="/data/openclaw.json"

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

# 上書き前に、いま動いている設定を手元へ退避する（初回は存在しないので失敗を許容）。
BACKUP="dist/openclaw.json.$(date -u +%Y%m%dT%H%M%SZ).bak"
if fly ssh console --app "$APP" -C "cat $REMOTE" > "$BACKUP" 2>/dev/null; then
  echo "→ 既存の設定を $BACKUP に退避"
else
  rm -f "$BACKUP"
  echo "→ 既存の設定なし（初回とみなします）"
fi

echo "→ $APP:$REMOTE へ送信"
printf 'put %s %s\n' "$OUT" "$REMOTE" | fly ssh sftp shell --app "$APP"

# automations とチャンネル設定を確実に読み直させる。gateway.reload.mode に
# よってはホットリロードされるが、再起動なら確実。常時 1 台なので短い断が入る。
echo "→ ゲートウェイを再起動"
fly apps restart "$APP"

echo "✓ 完了。ログ: fly logs --app $APP"
