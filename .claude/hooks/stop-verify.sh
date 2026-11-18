#!/usr/bin/env bash
# Claude Code Stop hook — refuses to let the agent finish while
# scripts/verify.sh fails on the branch's changes (the "verify loop").
#
# - No changes / docs-only changes / already-verified diff  -> allow (fast).
# - verify.sh fails -> {"decision":"block","reason":...}: the agent keeps working
#   with the failure output as feedback.
# - Gives up after TOBAN_VERIFY_MAX_ATTEMPTS consecutive blocks (default 3) so a
#   session can never be trapped; it then lets the agent stop and asks it to
#   report the failure honestly.
# - Opt out for a session: TOBAN_SKIP_STOP_VERIFY=1 claude ...

set -uo pipefail

[ "${TOBAN_SKIP_STOP_VERIFY:-}" = "1" ] && exit 0

INPUT=$(cat)
CWD=$(jq -r '.cwd // empty' <<<"$INPUT")
SESSION=$(jq -r '.session_id // "unknown"' <<<"$INPUT")
cd "${CWD:-${CLAUDE_PROJECT_DIR:-.}}" 2>/dev/null || exit 0
ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$ROOT"
GITDIR=$(git rev-parse --absolute-git-dir)

BASE=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null) || exit 0
UNTRACKED=$(git ls-files --others --exclude-standard)
CODE_CHANGED=$( { git diff --name-only "$BASE"; echo "$UNTRACKED"; } \
  | grep -E '\.(ts|tsx|js|jsx|cjs|mjs|json|jsonc|sol|graphql|yaml|yml)$' || true)
[ -z "$CODE_CHANGED" ] && exit 0

# Fingerprint the diff so an unchanged, already-green tree is not re-verified.
FP=$( { git diff "$BASE"; for f in $UNTRACKED; do [ -f "$f" ] && { echo "$f"; cat "$f"; }; done; } | sha256sum | cut -c1-40)
PASS_FILE="$GITDIR/toban-verify-pass"
[ -f "$PASS_FILE" ] && [ "$(cat "$PASS_FILE")" = "$FP" ] && exit 0

ATTEMPT_FILE="$GITDIR/toban-verify-attempts-$SESSION"
ATTEMPTS=$(cat "$ATTEMPT_FILE" 2>/dev/null || echo 0)
MAX=${TOBAN_VERIFY_MAX_ATTEMPTS:-3}

OUT=$("$ROOT/scripts/verify.sh" 2>&1)
STATUS=$?

if [ $STATUS -eq 0 ]; then
  echo "$FP" >"$PASS_FILE"
  rm -f "$ATTEMPT_FILE"
  exit 0
fi

if [ "$ATTEMPTS" -ge "$MAX" ]; then
  rm -f "$ATTEMPT_FILE"
  jq -n --arg m "scripts/verify.sh still fails after $MAX fix attempts. Stopping; report the remaining failure to the user instead of claiming done." \
    '{systemMessage: $m}'
  exit 0
fi
echo $((ATTEMPTS + 1)) >"$ATTEMPT_FILE"

REASON=$(printf 'scripts/verify.sh failed (attempt %s/%s). Fix the root cause — do not skip, weaken, or delete checks/tests — then finish again.\n\n%s' \
  "$((ATTEMPTS + 1))" "$MAX" "$(tail -n 120 <<<"$OUT")")
jq -n --arg r "$REASON" '{decision: "block", reason: $r}'
exit 0
