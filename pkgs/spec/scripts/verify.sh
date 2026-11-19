#!/usr/bin/env bash
# `pnpm spec verify`:
#   1. lake build — every theorem checks; warningAsError (lakefile.toml) makes
#      any `sorry` a failure.
#   2. Regenerate the test vectors and fail if they differ from the committed
#      ones, so the contract's differential test never runs on a stale model.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.elan/bin:$PATH"

command -v lake >/dev/null || bash scripts/setup-lean.sh

lake build
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
lake exe gen-vectors >"$tmp"
if ! cmp -s "$tmp" vectors/splits-creator.json; then
  echo "vectors/splits-creator.json is stale: run 'pnpm spec vectors' and commit the result." >&2
  exit 1
fi
echo "spec: proofs build, vectors up to date"
