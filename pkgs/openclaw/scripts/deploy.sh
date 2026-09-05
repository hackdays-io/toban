#!/usr/bin/env bash
#
# OpenClaw ゲートウェイを Fly にデプロイする。
#
#   pnpm openclaw deploy:fly
#
# 設定ファイル（/data/openclaw.json）はこれでは入れ替わらない。
# 初回、および設定を変えたときは push:config を別途流すこと。
set -euo pipefail

cd "$(dirname "$0")/.."

APP="$(sed -n 's/^app *= *"\(.*\)"/\1/p' fly.toml | head -1)"
VOLUME="$(sed -n 's/^ *source *= *"\(.*\)"/\1/p' fly.toml | head -1)"

if ! command -v fly >/dev/null 2>&1; then
  echo "✗ fly CLI が見つかりません: https://fly.io/docs/flyctl/install/" >&2
  exit 1
fi

echo "→ 事前確認: ボリューム $VOLUME"
if ! fly volumes list --app "$APP" 2>/dev/null | grep -q "$VOLUME"; then
  cat >&2 <<MSG
✗ ボリューム $VOLUME がありません。先に作ってください:

    fly volumes create $VOLUME --size 1 --region nrt --app $APP

  ボリュームが無いまま deploy すると、設定と automations の状態が
  再起動のたびに消えます。
MSG
  exit 1
fi

echo "→ 事前確認: secrets"
SECRETS="$(fly secrets list --app "$APP" 2>/dev/null || true)"
MISSING=""
for name in OPENCLAW_GATEWAY_TOKEN DISCORD_BOT_TOKEN TOBAN_MCP_TOKEN; do
  echo "$SECRETS" | grep -q "$name" || MISSING="$MISSING $name"
done
# LLM プロバイダの鍵はどれか 1 つあればよい。
if ! echo "$SECRETS" | grep -qE "ANTHROPIC_API_KEY|OPENROUTER_API_KEY|OPENAI_API_KEY"; then
  MISSING="$MISSING <ANTHROPIC_API_KEY|OPENROUTER_API_KEY|OPENAI_API_KEY のいずれか>"
fi
if [ -n "$MISSING" ]; then
  echo "✗ 未設定の secret:$MISSING" >&2
  echo "  fly secrets set <NAME>=... --app $APP" >&2
  exit 1
fi

echo "→ 設定のレンダリング確認（送信はしない）"
pnpm exec tsx scripts/render-config.ts --out dist/openclaw.json

echo "→ fly deploy"
fly deploy --app "$APP"

cat <<MSG

✓ デプロイ完了。

  設定を変えた場合は続けて:  pnpm openclaw push:config
  ログ:                      fly logs --app $APP
MSG
