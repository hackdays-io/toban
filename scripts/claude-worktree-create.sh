#!/usr/bin/env bash
# Claude Code WorktreeCreate hook for Toban (pnpm workspace monorepo).
#
# Contract (https://code.claude.com/docs/en/hooks):
#   - Receives JSON on stdin with a `.name` field (the requested worktree name).
#   - MUST print the absolute worktree path on stdout (and nothing else).
#   - Progress output goes to /dev/tty so it does not pollute stdout.
#   - Non-zero exit aborts worktree creation.

set -euo pipefail

INPUT=$(cat)
NAME=$(echo "$INPUT" | jq -r '.name')
REPO_PATH="$CLAUDE_PROJECT_DIR"
WORKTREE_PATH="${REPO_PATH}/.claude/worktrees/${NAME}"
BRANCH="worktree-${NAME}"
BASE_REF="${TOBAN_WORKTREE_BASE_REF:-HEAD}"

TTY=/dev/tty
log() { echo "$*" > "$TTY" 2>/dev/null || true; }

mkdir -p "${REPO_PATH}/.claude/worktrees"

log "Creating worktree '${NAME}' from ${BASE_REF}..."
if git -C "$REPO_PATH" rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  git -C "$REPO_PATH" worktree add "$WORKTREE_PATH" "$BRANCH" >/dev/null 2>&1
else
  git -C "$REPO_PATH" worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE_REF" >/dev/null 2>&1
fi

# Copy gitignored env files. .worktreeinclude is bypassed when this hook
# replaces default git behavior, so handle it explicitly.
log "Copying env files..."
ENV_FILES=(
  "pkgs/cli/.env"
  "pkgs/contract/.env"
  "pkgs/frontend/.env"
  "pkgs/frontend/.env.base"
)
for f in "${ENV_FILES[@]}"; do
  if [ -f "${REPO_PATH}/$f" ]; then
    mkdir -p "$(dirname "${WORKTREE_PATH}/$f")"
    cp "${REPO_PATH}/$f" "${WORKTREE_PATH}/$f"
  fi
done

LOGFILE="${WORKTREE_PATH}/.worktree-setup.log"
SETUP_ERRORS=()

log "Running pnpm install (output: ${LOGFILE})..."
(cd "$WORKTREE_PATH" && pnpm install --frozen-lockfile) >> "$LOGFILE" 2>&1 \
  || SETUP_ERRORS+=("pnpm install failed")

log "Running contract hardhat compile..."
(cd "$WORKTREE_PATH" && pnpm contract compile) >> "$LOGFILE" 2>&1 \
  || SETUP_ERRORS+=("contract compile failed")

if [ ${#SETUP_ERRORS[@]} -gt 0 ]; then
  log "Worktree created with warnings:"
  printf '  - %s\n' "${SETUP_ERRORS[@]}" > "$TTY" 2>/dev/null || true
  log "Details: ${LOGFILE}"
else
  log "Worktree ready: ${WORKTREE_PATH}"
fi

# THE ONLY thing on stdout — Claude parses this as the worktree path.
echo "$WORKTREE_PATH"
