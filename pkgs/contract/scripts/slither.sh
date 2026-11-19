#!/usr/bin/env bash
# `pnpm contract slither`: static analysis of the Toban contracts with Slither.
# Fails on any finding not suppressed in slither.config.json or by an inline
# `// slither-disable-next-line <detector>` comment. Every suppression has a
# reason: see AGENTS.md "Static analysis (Slither)".
#
# Slither runs through `uvx` at a pinned version, so nothing is installed into
# the system Python. uv itself is installed here if missing (CI, fresh machines).
# `--setup` only installs uv and caches Slither (WorktreeCreate hook).
set -euo pipefail
cd "$(dirname "$0")/.."

SLITHER_VERSION=0.11.6
UV_VERSION=0.8.13
export PATH="$HOME/.local/bin:$PATH"
slither() { uvx --from "slither-analyzer==${SLITHER_VERSION}" slither "$@"; }

if ! command -v uvx >/dev/null; then
  echo "slither.sh: uv not found; installing uv ${UV_VERSION} into ~/.local/bin" >&2
  curl -LsSf "https://astral.sh/uv/${UV_VERSION}/install.sh" | env UV_NO_MODIFY_PATH=1 sh
fi

if [ "${1:-}" = "--setup" ]; then
  slither --version
  exit 0
fi

# Slither reads Hardhat's build-info (hardhat_ignore_compile), so compile first.
# --force: an incremental Hardhat 3 compile writes a partial build-info next to
# the old one, and Slither would read both and report stale line numbers
# (inline suppressions then miss). A full compile leaves one build-info (~25s).
npx hardhat compile --force --quiet
slither . --config-file slither.config.json
