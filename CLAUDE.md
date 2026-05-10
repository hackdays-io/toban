# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Per-package guides

Each workspace package has its own `CLAUDE.md` with package-specific architecture, commands, and conventions. **Read the relevant one before working in a package** — this file only covers cross-cutting concerns.

- `pkgs/frontend/CLAUDE.md` — React Router v7 (Remix) app, Tailwind v4, shadcn/ui, Privy, viem, Goldsky/Apollo
- `pkgs/contract/CLAUDE.md` — Hardhat + UUPS upgradeable Solidity, Hats Protocol / Splits integration
- `pkgs/subgraph/CLAUDE.md` — Goldsky-deployed The Graph subgraph
- `pkgs/cli/CLAUDE.md` — Commander-based TypeScript CLI
- `pkgs/document/CLAUDE.md` — Docusaurus documentation site

## Monorepo layout

pnpm workspace (`pnpm-workspace.yaml` → `pkgs/*`). Node `>=20`, package manager pinned to `pnpm@10.15.0`. Workspace scripts at the root delegate via `pnpm --filter`:

```
pnpm frontend <script>   # → pkgs/frontend
pnpm contract <script>   # → pkgs/contract
pnpm subgraph <script>   # → pkgs/subgraph
pnpm cli <script>        # → pkgs/cli
pnpm document <script>   # → pkgs/document
```

Always run from the repo root using these aliases rather than `cd`-ing into a package.

## Domain model (cross-package)

Toban is a role-based contribution + reward system. The same concepts appear in contracts, subgraph entities, and frontend hooks/routes — keep terminology aligned across packages:

- **Workspace** — a tree of roles created by the `BigBang` contract. Identified by a Hats `treeId` (used directly as a frontend route param: `app/routes/$treeId._index.tsx` etc.).
- **Role / Hat** — a position in the tree (Hats Protocol). The `HatsTimeFrameModule` records wear-time; `HatsHatCreatorModule` lets non-admins create child hats.
- **ThanksToken / FractionToken** — peer-to-peer "assist credit" tokens. Note: `ThanksToken`, `FractionToken`, "Assist Credit", and "Role Share" all refer to the same concept across versions of the codebase (see README).
- **Splits** — reward distribution. `SplitsCreator` derives split allocations from time-weighted role wear; deployed via `SplitsCreatorFactory`.
- **BigBang** — single entry point that deploys a workspace's full contract set; its `Executed` event is the seed for subgraph indexing.

When adding a feature, expect to touch all three layers: contract event → subgraph mapping/schema → frontend hook + route.

## Tooling shared across packages

- **Biome** is the formatter/linter for JS/TS/JSON (`pnpm biome:check`, `pnpm biome:format`). ESLint/Prettier are not used at the root. `biome.json` excludes generated dirs (`subgraph/generated`, `frontend/gql`, `contract/test`, `contract/artifacts`, `.claude/worktrees`, etc.) — don't fight Biome by editing those.
- **Lefthook** pre-commit (`lefthook.yaml`): Biome check + format on staged JS/TS/JSON, plus `pnpm frontend typecheck` on staged TS/TSX. If a hook fails, fix the underlying issue and create a new commit — do not `--no-verify`.
- **Solidity** has its own toolchain (solhint + Hardhat); see `pkgs/contract/CLAUDE.md`.
- **TypeScript strict** everywhere. Each package has its own `tsconfig.json`.

## Deployment targets

- **Sepolia** — testnet, primary dev environment. Subgraph: `toban-sepolia/1.0.3` on Goldsky.
- **Base** — production. Subgraph: `toban-base/0.0.1` on Goldsky. Frontend: https://toban.xyz.
- Canonical contract addresses for each network live in `README.md` and `pkgs/subgraph/config/{sepolia,base}.json`.

## Claude Code worktree workflow

`.claude/settings.json` registers `WorktreeCreate` / `WorktreeRemove` hooks (scripts in `scripts/claude-worktree-*.sh`).

```
claude --worktree issue/xxx       # creates .claude/worktrees/issue/xxx + bootstraps env
```

The bootstrap script copies `.env` files from the main checkout, runs `pnpm install --frozen-lockfile`, and `pnpm contract compile`. It does **not** run `pnpm frontend codegen` — the generated GraphQL types in `pkgs/frontend/gql/` are committed; only re-run codegen if the subgraph schema changed. See README §"Development with Claude Code (worktree)" for the full flow including `TOBAN_WORKTREE_BASE_REF=origin/main` for clean branches.

## When making changes

- Don't add new top-level packages, build tools, or formatters without a clear reason — the toolchain is intentionally minimal (pnpm + Biome + Lefthook + per-package tooling).
- Preserve workspace boundaries: code in `pkgs/frontend` should not import from `pkgs/contract` source; it consumes ABIs from `pkgs/frontend/abi/` (regenerated/copied) and the Goldsky GraphQL endpoint.
- The `.github/copilot-instructions.md` references Serena MCP tooling; that guidance does not apply here — use Claude Code's native tools.
