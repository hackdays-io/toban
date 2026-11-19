#!/usr/bin/env bash
# `pnpm spec vectors`: regenerate vectors/ from the Lean models.
# `--check`: regenerate into a temp dir and fail if vectors/ differs (a stale,
# missing or orphaned file). The modules are listed only in GenVectors.lean.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.elan/bin:$PATH"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
lake exe gen-vectors "$tmp"

if [[ "${1:-}" == "--check" ]]; then
  if ! diff -rq "$tmp" vectors >&2; then
    echo "vectors/ is stale: run 'pnpm spec vectors' and commit the result." >&2
    exit 1
  fi
else
  rm -f vectors/*.json
  cp "$tmp"/*.json vectors/
fi
