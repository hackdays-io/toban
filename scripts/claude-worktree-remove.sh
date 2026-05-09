#!/usr/bin/env bash
# Claude Code WorktreeRemove hook for Toban.
# Receives JSON on stdin with `.name`. Failures are non-blocking (logged only).
set -euo pipefail

INPUT=$(cat)
NAME=$(echo "$INPUT" | jq -r '.name')
REPO_PATH="$CLAUDE_PROJECT_DIR"
WORKTREE_PATH="${REPO_PATH}/.claude/worktrees/${NAME}"
BRANCH="worktree-${NAME}"

git -C "$REPO_PATH" worktree remove --force "$WORKTREE_PATH" >/dev/null 2>&1 || true
git -C "$REPO_PATH" branch -D "$BRANCH" >/dev/null 2>&1 || true
