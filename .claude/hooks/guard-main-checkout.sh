#!/usr/bin/env bash
# Claude Code PreToolUse hook (Edit|Write|NotebookEdit).
# Denies file edits inside the *main* checkout while it is on `main`, so work
# always happens in a worktree (`claude --worktree <name>`) or a feature branch.
# Files outside the repository (memory, scratchpad, ~/.claude) are not affected.

set -uo pipefail

INPUT=$(cat)
FILE=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$INPUT")
[ -z "$FILE" ] && exit 0

DIR=$(dirname "$FILE")
while [ ! -d "$DIR" ] && [ "$DIR" != "/" ]; do DIR=$(dirname "$DIR"); done
cd "$DIR" 2>/dev/null || exit 0
git rev-parse --show-toplevel >/dev/null 2>&1 || exit 0

# Linked worktrees have git-dir != git-common-dir; only guard the main checkout.
[ "$(git rev-parse --absolute-git-dir)" != "$(cd "$(git rev-parse --git-common-dir)" && pwd)" ] && exit 0
[ "$(git branch --show-current)" != "main" ] && exit 0

jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny",
  permissionDecisionReason: "The main checkout is on `main`. Start a worktree first (EnterWorktree, or `claude --worktree <name>`), or switch to a feature branch. See AGENTS.md > Required workflow."}}'
exit 0
