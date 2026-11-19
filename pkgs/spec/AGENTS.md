# AGENTS.md — pkgs/spec

Lean 4 reference models of Toban's own contract logic, the proofs of its protocol principles, and the test vectors the contract's differential tests replay. The human-readable side is `pkgs/document/docs/protocol/` (see the Overview page there for the full method).

## Stack

- **Lean 4, core only (no Mathlib)**, version pinned in `lean-toolchain` and managed by **elan** (like nvm). `pnpm spec verify` installs elan + the toolchain itself when `lake` is missing (`scripts/setup-lean.sh`, also `pnpm spec setup`), so CI and new worktrees need no setup step and only pay for Lean when `verify.sh` selects this package. Scripts add `~/.elan/bin` to `PATH` themselves.
- **Lake** build (`lakefile.toml`): library `Spec`, executable `gen-vectors`. `warningAsError = true`, so a `sorry` (or any warning, e.g. a deprecated lemma name) fails the build.

## Commands

```
pnpm spec setup      # install elan + the pinned toolchain
pnpm spec build      # lake build
pnpm spec vectors    # regenerate vectors/*.json — run after changing a model or the generator, and commit the result
pnpm spec verify     # lake build + fail if committed vectors differ from a fresh generation
```

## Layout

- `Spec/<Module>/Model.lean` — the executable model. Mirror the Solidity expression order exactly (every `/` is `Nat` floor division in the same place). `none` = the contract reverts. Data read from other contracts is plain input.
- `Spec/<Module>/Theorems.lean` — principles. Each principle theorem has `-- <ID>: <one-line statement>` on the line directly above it.
- `GenVectors.lean` — hand-written edge cases + seeded pseudo-random inputs → JSON (numbers as decimal strings). Deterministic: same seed, same file.
- `vectors/` — generated, committed (so contract tests run without Lean). Consumed by `pkgs/contract/test/*.Differential.ts` via the `@toban/spec` devDependency.

## Principles: IDs and status

- ID = `<PREFIX>-<n>` (`SPL` = SplitsCreator); never renumber or reuse. The same ID goes in the docs Principles table, the Lean comment, and `[ID]` in contract test names.
- Docs status has two axes: Proof `proven (Lean)` / `—`; Implementation `fuzzed` (a `*Differential*` test) and/or `tested` (any other tagged test) / `—`.
- `scripts/check-spec-ids.mjs` (always run by `scripts/verify.sh`) fails when the declared status and the theorems/tests disagree, or when an ID appears in only some places. Tag a test only if it really checks that principle.
- The principle wording (and Goal / Rationale) is reviewed by a human; propose, don't finalize.

## Adding a module

1. `Spec/<Module>/Model.lean` + `Theorems.lean`, import both from `Spec.lean`.
2. Extend `GenVectors.lean` (or add an exe) to write `vectors/<module>.json`.
3. Contract: data mocks under `contracts/<module>/mock/` + `test/<Module>.Differential.ts`.
4. Docs: fill `pkgs/document/docs/protocol/modules/<module>.md` (Goal / Mechanism / Rationale / Principles).
