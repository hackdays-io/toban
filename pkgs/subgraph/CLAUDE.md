# CLAUDE.md — pkgs/subgraph

Guidance for the Toban subgraph (indexer). Repo-root `CLAUDE.md` covers the cross-package domain model.

## Stack

- **The Graph Protocol** (`@graphprotocol/graph-cli` 0.51, `graph-ts` 0.31) — AssemblyScript mappings.
- **Goldsky** for hosting (`goldsky subgraph deploy`). Deployments: `toban-sepolia/1.0.3`, `toban-base/0.0.1`.
- `subgraph.yaml` is **generated** from `subgraph.template.yaml` + `config/<network>.json` via `mustache`. **Don't edit `subgraph.yaml` directly** — your changes will be wiped on the next `prepare:*`.

## Commands

```
pnpm subgraph prepare:sepolia   # mustache-render subgraph.yaml from config/sepolia.json
pnpm subgraph prepare:base
pnpm subgraph codegen           # graph codegen → generated/ (AssemblyScript types from ABIs)
pnpm subgraph build             # graph build → build/
pnpm subgraph deploy:sepolia    # goldsky deploy (requires `goldsky login` first)
pnpm subgraph deploy:base
pnpm subgraph update:sepolia    # update version metadata
pnpm subgraph delete:sepolia    # tear down
```

Standard release flow: `prepare:<net>` → `codegen` → `build` → `deploy:<net>`.

## Layout

- `subgraph.template.yaml` — single template; `prepare:*` substitutes `{{contracts}}` / `{{templatesContracts}}` from the network config.
- `config/{sepolia,base}.json` — network-specific seed contract address (BigBang), startBlock, and the list of `templatesContracts` (the Hats modules / ThanksToken / SplitsCreator instances spawned by BigBang). Adding a new event handler means editing **both** the relevant config file *and* the mapping module.
- `schema.graphql` — entity definitions queried by the frontend.
- `src/` — mapping handlers, one file per source contract:
  - `bigbangMapping.ts` — handles `Executed` (workspace creation); spawns the dynamic `templates` for the new modules.
  - `hatsModuleMapping.ts` — Hats module events (FractionToken / HatCreator / TimeFrame).
  - `thanksTokenMapping.ts` — ThanksToken transfers and mints.
  - `fractionTokenMapping.ts` — legacy standalone FractionToken.
  - `questMapping.ts` — HatsQuestModule events.
  - `helper/` — shared entity-loading utilities.
- `abis/` — ABIs the codegen reads from. Keep these in sync with `pkgs/contract/artifacts/` after contract changes (typically by copying the relevant `.json`).
- `generated/` — codegen output, **gitignored / Biome-ignored**. Don't edit by hand.

## When adding a new contract event

1. Add (or update) the contract entry in `config/<network>.json` for every network the contract is deployed on.
2. Drop the matching ABI into `abis/` (or update if the signature changed).
3. Add the entity to `schema.graphql` if you need to expose new fields.
4. Implement the handler in `src/<name>Mapping.ts`. Register it in `subgraph.template.yaml` if it's a new source/template.
5. Run `prepare:<net>` → `codegen` → `build` to verify; deploy when ready.
6. Update `pkgs/frontend/codegen.ts` consumers — but note frontend `gql/` is regenerated against the **deployed** Goldsky endpoint, so the subgraph must be deployed first.

## Notes

- AssemblyScript is *not* TypeScript. Common gotchas: no closures, no `null`-vs-`undefined`, integer types (`BigInt`/`i32`/`i64`) are explicit, string concat with `+` only.
- Biome's linter is configured to skip `subgraph/src/**` (AssemblyScript would trip JS rules); formatting still applies.
- Mappings should be **idempotent and side-effect-free** beyond entity writes — a reindex must produce the same store state.
