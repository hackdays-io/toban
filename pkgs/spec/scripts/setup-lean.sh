#!/usr/bin/env bash
# Installs elan (the Lean toolchain manager, like nvm for Node) if missing, and
# the toolchain pinned in lean-toolchain. `scripts/verify.sh` calls this when
# `lake` is not found, so CI and fresh worktrees need no extra setup step.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.elan/bin:$PATH"

# Installer pinned to a release tag; the Lean version itself comes from lean-toolchain.
ELAN_VERSION=v4.2.4
if ! command -v elan >/dev/null; then
  curl -sSfL "https://raw.githubusercontent.com/leanprover/elan/${ELAN_VERSION}/elan-init.sh" \
    | sh -s -- -y --default-toolchain none --no-modify-path
fi
elan toolchain install "$(cat lean-toolchain)"
