# AGENTS.md

Guidance for coding agents (Claude Code, Codex, Copilot, ...) working in this repository.

> **Note**: `CLAUDE.md` in each directory is a one-line `@AGENTS.md` import. **Edit `AGENTS.md`, never `CLAUDE.md`.** Claude-Code-only mechanics (hooks, skills, subagents) live under `.claude/`.

## Required workflow (agent loop)

Rules that must hold are enforced by hooks/scripts, not just by this text. When a rule here and an enforcement mechanism disagree, fix one of them in the same PR.

| Rule | Enforced by |
| --- | --- |
| Do not edit the main checkout while it is on `main` | `.claude/hooks/guard-main-checkout.sh` (PreToolUse) |
| Not done until `scripts/verify.sh` exits 0 | `.claude/hooks/stop-verify.sh` (Stop) |
| Biome + frontend typecheck on commit | Lefthook (`lefthook.yaml`) |
| Same `scripts/verify.sh` on every PR | GitHub Actions `check.yml` |
| Every workspace package is registered (AGENTS.md, CLAUDE.md, root alias, a check script, listed below) | `scripts/verify.sh` structure check |
| Contract tests / frontend build | GitHub Actions `test-contract.yml` / `build-frontend.yml` |

### 1. Start in a worktree
- Every change starts in a worktree branched from a fresh `origin/main`: `claude --worktree issue/<n>` from the shell, or `EnterWorktree` inside a session. The `WorktreeCreate` hook copies `.env` files and `.claude/settings.local.json`, then runs `pnpm install --frozen-lockfile` and `pnpm contract compile`.
- Uncommitted changes on `main` → `git stash -u`, create the worktree, `git stash pop` there. Never leave work in progress on `main`.
- To stack on another branch: `TOBAN_WORKTREE_BASE_REF=<ref> claude --worktree ...`.

### 2. Write down "done" before coding
State 3–7 acceptance criteria that a machine or a quick manual check can decide (test names, commands, visible behavior). If only the user can decide something, ask once, up front, with every open question together. Vague goals ("clean it up") are not loopable — narrow them first.

### 3. Implement → verify → fix (the loop)
- `scripts/verify.sh` is the Definition of Done. It diffs against `origin/main`, runs Biome on changed files, and for every changed package **and every package depending on it** runs that package's `verify` script, or else its `typecheck` + `test`. Packages are discovered from `pnpm-workspace.yaml` — the script names no package, so give a package special checks via a `verify` script in its `package.json` (see `pkgs/subgraph`, `pkgs/document`), not by editing `verify.sh`. `--list` shows the plan, `--all` runs everything.
- The Stop hook runs it whenever code changed and blocks the turn with the failure output, at most `TOBAN_VERIFY_MAX_ATTEMPTS` (default 3) times in a row; after that, the agent must report the remaining failure instead of claiming done. A tree that already passed is not re-run. Opt out for exploratory sessions with `TOBAN_SKIP_STOP_VERIFY=1`.
- Fix root causes. **Never delete, skip, or weaken a test or check to get green**, and never `--no-verify`.
- Judge "done" by evidence (exit codes, test output), not by your own impression.
- For multi-session work, open a Draft PR early and keep its body checklist as the progress log, so the next session (or a person) can resume.

### 4. Self-review with a separate reviewer
1. `/simplify` — remove duplication/over-engineering first.
2. `toban-reviewer` subagent (`.claude/agents/`) — give it the diff and the acceptance criteria, **not your conclusions**. `/code-review` may be used too.
3. Re-run `scripts/verify.sh`; drop out-of-scope changes.

### 5. Commit → push → PR without asking
Once steps 3–4 pass, commit, push, and open the PR without asking for confirmation (the `/ship` skill does steps 1–5).
- Check `gh pr list --head <branch> --state all` first, so you never push to a merged/closed PR.
- Commit/PR title style follows history: `feat(frontend): 〜`, `fix(contract): 〜` (short, Japanese OK).
- PR body: follow `.github/PULL_REQUEST_TEMPLATE.md`; include `Resolves #<n>`, the acceptance-criteria checklist, the `verify.sh` PASS lines, screenshots for UI changes, and a **deploy impact** line (ABI sync / subgraph redeploy / codegen / Worker order / Turnkey policy / env vars, or "none").
- One task per PR. Independent tasks → separate worktrees and PRs.

### 6. Babysit the PR until it is mergeable
Run `/pr-watch <n>` (or `/loop /pr-watch <n>` to self-pace): resolve conflicts, fix failing CI from `gh run view --log-failed`, answer every unresolved review thread (fix + reply with the SHA, or reply with the reason for not fixing), then resolve the thread. Do not silently resolve. **Do not merge, deploy, or touch secrets/Turnkey policy** — hand those to a human with a PR comment.

### 7. Compound: feed lessons back into the harness
When an agent makes a mistake, fix the environment so it cannot recur — not just the output.
- Per PR (`/ship` step 6): if you were corrected, asked to explain, or hit the same failure twice, add the fix **in the same PR**, choosing the strongest place that works: hook → `verify.sh`/test → skill/`toban-reviewer` → `AGENTS.md` (one or two lines). Personal preferences go to the user's own memory, not the repo.
- Across sessions (`/retro`, weekly): `node scripts/retro-signals.mjs` extracts friction signals from local Claude Code transcripts (mid-turn messages, corrections, restated requests, requests for explanation, hook blocks). Read the data, group and count it, then open a PR with evidence-backed changes and deletions. Never paste transcript text into a PR.
- Every rule should trace back to a real failure; delete rules nothing points to.

### 7. Compound: feed lessons back into the harness
When an agent makes a mistake, fix the environment so it cannot recur — not just the output.
- Per PR (`/ship` step 6): if you were corrected, asked to explain, or hit the same failure twice, add the fix **in the same PR**, choosing the strongest place that works: hook → `verify.sh`/test → skill/`toban-reviewer` → `AGENTS.md` (one or two lines). Personal preferences go to the user's own memory, not the repo.
- Across sessions (`/retro`, weekly): `node scripts/retro-signals.mjs` extracts each typed message with the agent's preceding words/actions and structural facts only (mid-turn, interrupted, rejected tool, hook block, restated). Judge meaning in that context and against the person's usual phrasing — never from keywords — confirm doubtful cases with the person, then open a PR with evidence-backed changes and deletions. Never paste transcript text into a PR.
- Every rule should trace back to a real failure; delete rules nothing points to.

### Escalate instead of looping
Stop and ask when: the same check fails 3 times for different reasons, the fix needs a product/spec decision, a deploy or an on-chain transaction would be required, or the change grows beyond the issue's scope.

## Per-package guides

Each workspace package has its own `AGENTS.md` with package-specific architecture, commands, and conventions. **Read the relevant one before working in a package** — this file only covers cross-cutting concerns.

- `pkgs/frontend/AGENTS.md` — React Router v7 (Remix) app, Tailwind v4, shadcn/ui, Privy, viem, Goldsky/Apollo
- `pkgs/contract/AGENTS.md` — Hardhat + UUPS upgradeable Solidity, Hats Protocol / Splits integration
- `pkgs/subgraph/AGENTS.md` — Goldsky-deployed The Graph subgraph
- `pkgs/document/AGENTS.md` — Docusaurus documentation site
- `pkgs/extensions/*/AGENTS.md` — External-service integrations (`identity`, `discord-bot`, `mcp`). Cloudflare Workers + D1 runtime. Each extension imports `@toban/identity` for account ↔ wallet binding.
- `pkgs/openclaw/AGENTS.md` — OpenClaw gateway on Fly.io (Discord agent). Deploy config + config template only, no app code. **No Turnkey stamper here** — signing stays in `@toban/discord-bot`.

## Monorepo layout

pnpm workspace (`pnpm-workspace.yaml` → `pkgs/*`). Node `>=20`, package manager pinned to `pnpm@10.15.0`. Workspace scripts at the root delegate via `pnpm --filter`:

```
pnpm frontend <script>     # → pkgs/frontend
pnpm contract <script>     # → pkgs/contract
pnpm subgraph <script>     # → pkgs/subgraph
pnpm document <script>     # → pkgs/document
pnpm identity <script>     # → pkgs/extensions/identity     (@toban/identity)
pnpm discord-bot <script>  # → pkgs/extensions/discord-bot  (@toban/discord-bot)
pnpm mcp <script>          # → pkgs/extensions/mcp          (@toban/mcp)
pnpm openclaw <script>     # → pkgs/openclaw                (@toban/openclaw)
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
- **Solidity** has its own toolchain (solhint + Hardhat); see `pkgs/contract/AGENTS.md`.
- **TypeScript strict** everywhere. Each package has its own `tsconfig.json`.
- CI (`.github/workflows/check.yml`) runs `scripts/verify.sh` against the PR base, so local and CI checks are the same thing. Contract tests and the frontend build also have their own workflows. `pkgs/document/tsconfig.json` is editor-only, so the docs package is checked by `docusaurus build` (its `verify` script), not `tsc`.

## Deployment targets

- **Sepolia** — testnet, primary dev environment. Subgraph: `toban-sepolia/1.0.3` on Goldsky.
- **Base** — production. Subgraph: `toban-base/0.0.1` on Goldsky. Frontend: https://toban.xyz.
- Canonical contract addresses are `pkgs/contract/outputs/contracts-<net>.json` (written by the deploy scripts). `README.md` carries a snapshot.

**`DEPLOYMENT.md` is the single source of truth for how to deploy anything.** The layers are
order-dependent and quietly break each other — read it before touching a deploy:

- Contract change → **always** `pnpm contract sync:abis`. A stale `pkgs/frontend/abi/bigbang.ts` changes `Executed`'s topic0 and silently breaks *all* workspace creation. (`verify.sh` warns when contract sources change without `pkgs/frontend/abi/`.)
- Subgraph must be deployed **before** `pnpm frontend codegen` (gql types come from the live schema).
- Cloudflare: **identity Worker before discord-bot** (service binding, else Cloudflare error 10143).
- **OpenClaw (Fly) after the Workers** — the agent calls the discord-bot Worker's MCP endpoint. `fly deploy` does *not* replace `/data/openclaw.json` (it lives on the volume); use `pnpm openclaw push:config` for config changes.
- Sepolia = wrangler *top-level* config; Base = `--env base`. **Both live in the same Cloudflare account**, separated by worker name and D1 — not by account.
- `pnpm --filter <pkg> deploy` collides with pnpm's builtin — use `deploy:sepolia` / `deploy:base`.
- Turnkey's `policy.json` is **not** auto-applied; new bot-signed selectors need a manual policy update. All Turnkey ops go through the `turnkey` CLI (`./turnkey/apply-policy.sh <base|sepolia>`), not the dashboard.

Agents prepare deploy-affecting changes and describe them in the PR; humans run the deploys.

## Worktree details

`.claude/settings.json` registers `WorktreeCreate` / `WorktreeRemove` hooks (scripts in `scripts/claude-worktree-*.sh`). Worktrees live in `.claude/worktrees/<name>` on branch `worktree-<name>`. The bootstrap does **not** run `pnpm frontend codegen` — the generated GraphQL types in `pkgs/frontend/gql/` are committed; only re-run codegen if the subgraph schema changed. See README §"Development with Claude Code (worktree)".

## Adding a workspace package

`verify.sh` and CI pick up a new package automatically, but the rest of the repo does not. Do all of this in the PR that adds it — items marked ✔ fail `verify.sh` if missing:

- ✔ `AGENTS.md` in the package (stack, commands, invariants) and a `CLAUDE.md` containing only `@AGENTS.md`.
- ✔ A `typecheck` and/or `test` script — or a `verify` script when the package needs something else (build, codegen).
- ✔ A root `package.json` alias (`"<alias>": "pnpm --filter <name>"`), added to the list in "Monorepo layout".
- ✔ An entry under "Per-package guides" above (the `pkgs/extensions/*` line covers extensions).
- Gitignored env files (`.env`, `.dev.vars`, ...) → add to `ENV_FILES` in `scripts/claude-worktree-create.sh`, and ship an `.env.example`.
- Deployable (Worker, Fly app, subgraph) → a section in `DEPLOYMENT.md`, including where it sits in the deploy order.
- New cross-package invariants (service bindings, shared D1, ABIs it consumes) → the "Cross-layer invariants" list in `.claude/agents/toban-reviewer.md`.
- Generated or build-output directories → `biome.json` `files.ignore`.

## When making changes

- Don't add new top-level packages, build tools, or formatters without a clear reason — the toolchain is intentionally minimal (pnpm + Biome + Lefthook + per-package tooling).
- Preserve workspace boundaries: code in `pkgs/frontend` should not import from `pkgs/contract` source; it consumes ABIs from `pkgs/frontend/abi/` (regenerated/copied) and the Goldsky GraphQL endpoint.
- Scripts and config that act on "every package" must discover packages (from `pnpm-workspace.yaml` / `pnpm list -r`), not list them by name — the workspace grows.
- Scripts and config that act on "every package" must discover packages (from `pnpm-workspace.yaml` / `pnpm list -r`), not list them by name — the workspace grows.
- New pure logic gets a test next to it. Fix bugs with a regression test first when practical.
- When you learn something a future agent would trip over (a non-obvious invariant, a deploy gotcha), add it to the relevant `AGENTS.md` in the same PR — keep each file short and move details to the package guide.
- The `.github/copilot-instructions.md` references Serena MCP tooling; that guidance does not apply here — use the agent's native tools.
