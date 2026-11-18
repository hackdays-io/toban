#!/usr/bin/env bash
# Toban verification gate — the mechanical "Definition of Done".
#
# Runs the checks affected by the current branch's changes
# (diff against the merge-base with origin/main + untracked files):
#   0. Workspace structure: every package is registered the way AGENTS.md
#      ("Adding a workspace package") requires.
#   1. Biome on changed JS/TS/JSON files, and scripts/check-todos.mjs
#      (every to-do marker names its issue) with its tests.
#   2. For every workspace package with changed (non-Markdown) files, plus every
#      package that depends on it (pnpm dependency graph):
#        - its `verify` script if it defines one, otherwise
#        - its `typecheck` and `test` scripts, whichever exist.
#
# No package is named here: a new package in pnpm-workspace.yaml is picked up
# automatically. Don't add per-package branches — add a `verify` script to that
# package's package.json instead.
#
#   scripts/verify.sh            # affected checks only
#   scripts/verify.sh --all      # every package (slow)
#   scripts/verify.sh --list     # print the plan without running it
#   (flags combine: --all --list)
#
# Used by humans, the Claude Code Stop hook (.claude/hooks/stop-verify.sh),
# the /ship skill, and CI (.github/workflows/check.yml).

set -uo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

# One run at a time per worktree: concurrent runs (e.g. the Stop hook while a
# manual run is in progress) share build dirs and fail each other.
if [ -z "${TOBAN_VERIFY_LOCKED:-}" ] && command -v flock >/dev/null; then
  export TOBAN_VERIFY_LOCKED=1
  exec flock "$(git rev-parse --absolute-git-dir)/toban-verify.lock" "$0" "$@"
fi

ALL=0; LIST=0
for arg in "$@"; do
  case "$arg" in
    --all) ALL=1 ;;
    --list) LIST=1 ;;
    *) echo "usage: $0 [--all] [--list]" >&2; exit 64 ;;
  esac
done

# Hardhat's well-known local account #0 — contract tests need *a* key, never a real one.
export PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"

BASE=$(git merge-base HEAD "${VERIFY_BASE_REF:-origin/main}" 2>/dev/null || git merge-base HEAD main 2>/dev/null || echo HEAD)
CHANGED=$( { git diff --name-only "$BASE"; git ls-files --others --exclude-standard; } | sort -u | grep . || true)
# Markdown-only edits (docs, AGENTS.md) never trigger package checks.
CODE_CHANGED=$(grep -vE '\.mdx?$' <<<"$CHANGED" || true)

declare -a PLAN=()
add() { PLAN+=("$1|$2"); }

# Workspace packages as "relative/dir<TAB>name<TAB>scripts", deepest dir first
# so a file maps to its innermost package.
pkg_table() {
  pnpm list "$@" --depth -1 --json 2>/dev/null | ROOT="$ROOT" node -e '
    const fs = require("fs"), path = require("path");
    JSON.parse(fs.readFileSync(0, "utf8"))
      .map(p => {
        const s = JSON.parse(fs.readFileSync(path.join(p.path, "package.json"), "utf8")).scripts || {};
        return [path.relative(process.env.ROOT, p.path), p.name, ["verify", "typecheck", "test"].filter(k => s[k]).join(" ")];
      })
      .filter(([d]) => d !== "")
      .sort((a, b) => b[0].length - a[0].length)
      .forEach(r => console.log(r.join("\t")));'
}
ALL_PKGS=$(pkg_table -r)

# --- 0. Workspace structure (cheap, always runs) ----------------------------
STRUCT_ERRORS=()
ROOT_SCRIPTS=$(node -e 'console.log(Object.values(require("./package.json").scripts || {}).join("\n"))')
while IFS=$'\t' read -r dir name scripts; do
  [ -z "$dir" ] && continue
  [ -f "$dir/AGENTS.md" ] || STRUCT_ERRORS+=("$dir: missing AGENTS.md")
  [ "$(cat "$dir/CLAUDE.md" 2>/dev/null)" = "@AGENTS.md" ] || STRUCT_ERRORS+=("$dir: CLAUDE.md must contain exactly '@AGENTS.md'")
  grep -qxF "pnpm --filter $name" <<<"$ROOT_SCRIPTS" || STRUCT_ERRORS+=("$dir: no root package.json alias \"pnpm --filter $name\"")
  [ -n "$scripts" ] || STRUCT_ERRORS+=("$dir: defines none of the scripts verify / typecheck / test, so nothing verifies it")
  grep -qF "\`$dir/AGENTS.md\`" AGENTS.md || grep -qF "\`$(dirname "$dir")/*/AGENTS.md\`" AGENTS.md \
    || STRUCT_ERRORS+=("$dir: not listed under 'Per-package guides' in the root AGENTS.md")
done <<<"$ALL_PKGS"

# --- 1. Biome ----------------------------------------------------------------
# Always the whole tree: Biome 1.9 ignores biome.json `files.ignore` for paths
# passed explicitly, so a file list would lint generated code. `.` takes <1s.
add "biome" "npx biome check --no-errors-on-unmatched --files-ignore-unknown=true ."
# Whole tree, like Biome: it reads only comments and takes <1s.
add "todos" "node --test 'scripts/*.test.mjs' && node scripts/check-todos.mjs"

# --- 2. Workspace packages ---------------------------------------------------
if [ $ALL -eq 1 ]; then
  TARGETS=$ALL_PKGS
else
  CHANGED_DIRS=$(while read -r f; do
      [ -z "$f" ] && continue
      while IFS=$'\t' read -r dir _; do
        case "$f" in "$dir"/*) echo "$dir"; break ;; esac
      done <<<"$ALL_PKGS"
    done <<<"$CODE_CHANGED" | sort -u)
  FILTERS=()
  # "...{dir}" = the package and everything that depends on it.
  for d in $CHANGED_DIRS; do FILTERS+=(--filter "...{$d}"); done
  TARGETS=""
  [ ${#FILTERS[@]} -gt 0 ] && TARGETS=$(pkg_table "${FILTERS[@]}")
fi

while IFS=$'\t' read -r _ name scripts; do
  [ -z "$name" ] && continue
  if grep -qw verify <<<"$scripts"; then
    add "$name verify" "pnpm --filter '$name' run verify"
  else
    grep -qw typecheck <<<"$scripts" && add "$name typecheck" "pnpm --filter '$name' run typecheck"
    grep -qw test <<<"$scripts" && add "$name test" "pnpm --filter '$name' run test"
  fi
done <<<"$TARGETS"

# --- Invariant warnings (not failures: a human/agent must judge) -------------
WARN=()
if [ $ALL -eq 0 ] && grep -qE '^pkgs/contract/contracts/' <<<"$CHANGED" \
  && ! grep -qE '^pkgs/frontend/abi/' <<<"$CHANGED"; then
  WARN+=("Contract sources changed but pkgs/frontend/abi/ did not. If any ABI changed, run 'pnpm contract sync:abis' (see DEPLOYMENT.md).")
fi
if [ $ALL -eq 0 ] && grep -qE '^pkgs/subgraph/schema\.graphql' <<<"$CHANGED"; then
  WARN+=("Subgraph schema changed: frontend codegen must run only after the subgraph is deployed (DEPLOYMENT.md).")
fi
if grep -qE '^(pnpm-workspace\.yaml|pkgs/[^/]+/package\.json|pkgs/extensions/[^/]+/package\.json)$' <<<"$(git diff --name-only --diff-filter=A "$BASE"; git ls-files --others --exclude-standard)"; then
  WARN+=("A workspace package was added: walk through AGENTS.md > 'Adding a workspace package' (env files in the worktree hook, DEPLOYMENT.md, reviewer agent).")
fi

# --- Run ---------------------------------------------------------------------
echo "verify: base=$(git rev-parse --short "$BASE") mode=$([ $ALL -eq 1 ] && echo all || echo affected) changed_files=$(grep -c . <<<"$CHANGED" || true)"
for w in "${WARN[@]:-}"; do [ -n "$w" ] && echo "WARN: $w"; done
for e in "${STRUCT_ERRORS[@]:-}"; do [ -n "$e" ] && echo "STRUCTURE: $e"; done
[ ${#PLAN[@]} -eq 0 ] && echo "verify: nothing else to check for these changes."

if [ $LIST -eq 1 ]; then
  for p in "${PLAN[@]:-}"; do [ -n "$p" ] && echo "  - ${p%%|*}: ${p#*|}"; done
  exit 0
fi

LOGDIR=$(mktemp -d "${TMPDIR:-/tmp}/toban-verify.XXXXXX")
FAILED=()
for p in "${PLAN[@]:-}"; do
  [ -z "$p" ] && continue
  name=${p%%|*}; cmd=${p#*|}
  log="$LOGDIR/$(tr ' /@' '___' <<<"$name").log"
  start=$(date +%s)
  if bash -c "$cmd" >"$log" 2>&1; then
    echo "PASS  $name ($(( $(date +%s) - start ))s)"
  else
    echo "FAIL  $name ($(( $(date +%s) - start ))s)  -> $cmd"
    FAILED+=("$name|$log")
  fi
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo
  for f in "${FAILED[@]}"; do
    echo "===== ${f%%|*} (last 60 lines; full log: ${f#*|}) ====="
    tail -n 60 "${f#*|}"
  done
fi
if [ ${#FAILED[@]} -gt 0 ] || [ ${#STRUCT_ERRORS[@]} -gt 0 ]; then
  echo
  echo "verify: FAILED (checks: ${#FAILED[@]}, structure: ${#STRUCT_ERRORS[@]})"
  exit 1
fi
echo "verify: OK"
