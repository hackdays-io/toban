# AGENTS.md — pkgs/spec

Lean 4 reference models of Toban's own contract logic, the proofs of its protocol principles, and the test vectors the contract's differential tests replay. The human-readable side is `pkgs/document/docs/protocol/` (see the Overview page there for the full method).

## Stack

- **Lean 4, core only (no Mathlib)**, version pinned in `lean-toolchain` and managed by **elan** (like nvm). `pnpm spec verify` installs elan + the toolchain itself when `lake` is missing (`scripts/setup-lean.sh`, also `pnpm spec setup`), so CI and new worktrees need no setup step and only pay for Lean when `verify.sh` selects this package. Scripts add `~/.elan/bin` to `PATH` themselves.
- **Lake** build (`lakefile.toml`): libraries `Spec` (models + proofs) and `Vectors` (one generator module per contract), executable `gen-vectors <module>`. `warningAsError = true`, so a `sorry` (or any warning, e.g. a deprecated lemma name) fails the build. In the pinned toolchain `if_pos` / `if_neg` are deprecated: use `simp only [h, ↓reduceIte]`.

## Commands

```
pnpm spec setup      # install elan + the pinned toolchain
pnpm spec build      # lake build
pnpm spec vectors    # regenerate vectors/*.json (scripts/vectors.sh) — run after changing a model or a generator, and commit the result
pnpm spec verify     # lake build + fail if committed vectors differ from a fresh generation
```

## Layout

- `Spec/<Module>/Model.lean` — the executable model over unbounded `Nat` (easy to prove things about). Mirror the Solidity expression order exactly (every `/` is `Nat` floor division in the same place). `none` = division by zero. Data read from other contracts is plain input.
- `Spec/<Module>/Contract.lean` — the same computation with Solidity 0.8 uint256 semantics (`Except Panic`: every `*` / `+` overflows at 2^256 → `.overflow` (0x11), `/` by 0 → `.divZero` (0x12)), in the contract's operation order, so the panic code matches. This is what the vectors are generated from.
- `Spec/<Module>/Refinement.lean` — proves `Rel (previewU i) (preview i)`: if the uint256 model returns, the `Nat` model returns the same value. Principles about results are then stated for the uint256 model via this. When you change one model, change the other and keep this proof building.
- `Spec/<Module>/Theorems.lean` — principles. Each principle theorem has `-- <ID>: <one-line statement>` on the line directly above it.
- `Vectors/<Module>.lean` — hand-written edge cases + seeded pseudo-random inputs → JSON (numbers as decimal strings). Deterministic: same seed, same file. `GenVectors.lean` holds the only list of modules and writes `<outDir>/<module>.json` for each; `scripts/vectors.sh` (`pnpm spec vectors` / `--check`) runs it.
- Stateful contracts (ThanksToken, HatsTimeFrameModule) are modeled as `step : Env → State → Op → Except Err State`; vectors are call sequences with the expected outcome of each call, and the refinement is `Rel (stepU …) (step …)` (same state or same revert reason unless overflow). HatsTimeFrameModule's principles are about states reachable by call sequences (`ReachableU`), proven via an invariant that ties storage to an abstract history of wearing periods.
- `vectors/` — generated, committed (so contract tests run without Lean). Consumed by `pkgs/contract/test/*.Differential.ts` via the `@toban/spec` devDependency.

## Principles: IDs and status

- ID = `<PREFIX>-<n>` (`SPL` = SplitsCreator, `THX` = ThanksToken, `HTF` = HatsTimeFrameModule); never renumber or reuse. The same ID goes in the docs Principles table, the Lean comment, and `[ID]` in contract test names.
- Docs status has two axes: Proof `proven (Lean)` / `—`; Implementation `fuzzed` (a `*Differential*` test) and/or `tested` (any other tagged test) / `—`.
- `scripts/check-spec-ids.mjs` (always run by `scripts/verify.sh`) fails when the declared status and the theorems/tests disagree, or when an ID appears in only some places. Tag a test only if it really checks that principle.
- The principle wording (and Goal / Rationale) is reviewed by a human; propose, don't finalize.

## Adding a module

1. `Spec/<Module>/Model.lean`, `Contract.lean`, `Refinement.lean` + `Theorems.lean`, imported from `Spec.lean`.
2. Add `Vectors/<Module>.lean` with a `json : String` and register it in `modules` in `GenVectors.lean`; `vectors/<module>.json` is then generated and checked.
3. Contract: `test/<Module>.Differential.ts`, fed through data mocks placed next to the contract they stand in for (`contracts/<mocked>/mock/`), shared across differential tests.
4. Docs: fill `pkgs/document/docs/protocol/modules/<module>.md` (目的 / 仕組み / 設計の理由 / 原則, in Japanese).
