#!/usr/bin/env bash
# Lefthook pre-commit: `typecheck` for the workspace packages that own the
# staged TS files — not every package, and not a fixed one.
#
# Packages with a `verify` script are skipped: their real check (build, codegen)
# is too slow for a commit and runs in scripts/verify.sh. Dependents are not
# checked either; verify.sh covers them.
#
# Takes the same lock as verify.sh, since both write build dirs such as
# pkgs/frontend/.react-router.
#
#   scripts/pre-commit-typecheck.sh <file>...

set -uo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

if [ -z "${TOBAN_VERIFY_LOCKED:-}" ] && command -v flock >/dev/null; then
  export TOBAN_VERIFY_LOCKED=1
  exec flock "$(git rev-parse --absolute-git-dir)/toban-verify.lock" bash "$0" "$@"
fi

# Package names that own at least one of the given files and have a
# `typecheck` script but no `verify` script.
NAMES=$(pnpm list -r --depth -1 --json 2>/dev/null | ROOT="$ROOT" node -e '
  const fs = require("fs"), path = require("path");
  const files = process.argv.slice(1);
  const pkgs = JSON.parse(fs.readFileSync(0, "utf8"))
    .map(p => ({ dir: path.relative(process.env.ROOT, p.path), name: p.name,
      s: JSON.parse(fs.readFileSync(path.join(p.path, "package.json"), "utf8")).scripts || {} }))
    .filter(p => p.dir !== "")
    .sort((a, b) => b.dir.length - a.dir.length);
  const owners = new Set(files.map(f => pkgs.find(p => f.startsWith(p.dir + "/"))).filter(Boolean));
  for (const p of owners) if (p.s.typecheck && !p.s.verify) console.log(p.name);
' "$@") || { echo "pre-commit-typecheck: could not resolve workspace packages (is pnpm on PATH?)" >&2; exit 1; }

status=0
for name in $NAMES; do
  echo "typecheck: $name"
  pnpm --filter "$name" run typecheck || status=1
done
exit $status
