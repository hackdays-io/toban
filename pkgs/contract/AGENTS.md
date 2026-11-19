# AGENTS.md — pkgs/contract

Guidance for the Toban smart contracts. Repo-root `AGENTS.md` covers monorepo concerns and the cross-package domain model; this file is contract-specific.

## Stack

- **Hardhat 3** (ESM, `"type": "module"`) with plugins listed in `hardhat.config.ts`: `hardhat-viem`, `hardhat-ethers` (some deploy helpers still use ethers — both are wired), `hardhat-mocha`, `hardhat-network-helpers`, `hardhat-verify`. Coverage and gas stats are built in (no `solidity-coverage` / `hardhat-gas-reporter`).
- **There is no global `viem` / `ethers` / `network.name`.** Helpers, scripts and tests import them from `helpers/connection.ts` (one shared `network.getOrCreate()` connection, so everything in a process talks to the same chain). Never import that module from `hardhat.config.ts` or `tasks/index.ts` — it awaits the network at load time.
- Tasks: definitions live in `tasks/index.ts` (`task().addOption().setAction(() => import(...))`); each action file default-exports `async (args, hre)` and calls `hre.network.getOrCreate()`. Options always have a default, so formerly required params default to `""` and are checked with `tasks/utils/requireOption.ts`.
- Tests use `expect` from `helpers/test/chai.ts` (registers chai-as-promised). `hardhat-mocha` fails the run on unhandled rejections, so always `await` contract calls and `.catch()` chains in tests. For views that read `block.timestamp`, pass `{ blockNumber }` and compare with that block's time — without it the call context's timestamp (latest vs latest+1) depends on wall-clock and the test flakes.
- **Solidity 0.8.24** with `viaIR: true`, optimizer **disabled** (`runs: 200` is set but inert), evmVersion `cancun` (see `hardhat.config.ts`). The same settings are pinned for both the `default` and `production` build profiles — Hardhat 3 would otherwise enable the optimizer in `production`.
- **`metadata.bytecodeHash: "none"`** — the bytecode carries no metadata hash, so `deploy:all` CREATE2 addresses depend only on code + compiler settings, not on source paths, comments or the build tool (same as Uniswap v4 / Seaport / Morpho Blue). Don't remove it: Hardhat 3 names sources `project/contracts/...`, so with a hash every address would move. Introduced with the Hardhat 3 migration (#623) — contracts deployed before that have different initcode, so the first `deploy:all` after it redeploys everything.
- **OpenZeppelin Upgradeable** (`@openzeppelin/contracts-upgradeable` 5.0.2) — UUPS pattern for `BigBang` and `FractionToken`-family contracts.
- Proxies are deployed by hand from `@openzeppelin/upgrades-core` artifacts (`helpers/deploy/Upgradeable.ts`) and upgraded via `upgradeToAndCall` (`helpers/upgrade/*`); the OZ Hardhat Upgrades plugin is not used.
- **Hats Protocol v1** (`@hatsprotocol/sdk-v1-core`) and **0xSplits** are external dependencies — Toban deploys *modules* and *creators* that plug into them.
- **solhint** (`pnpm contract lint`) for Solidity linting. Biome handles TS scripts/tests. Note: `biome.json` excludes `contract/test` from lint and `contract/artifacts`/`contract/cache` from everything.

## Commands

```
pnpm contract compile            # hardhat compile
pnpm contract test               # hardhat test (mocha + viem matchers)
pnpm contract coverage           # hardhat test --coverage (built in)
pnpm contract clean              # hardhat clean
pnpm contract lint               # solhint --fix
pnpm contract local              # local hardhat node
pnpm contract sync:abis          # ★ regenerate pkgs/frontend/abi/ + pkgs/subgraph/abis/ — run after ANY contract change
pnpm contract deploy:all --network <net>          # CREATE2 deploy of all impls + factories
pnpm contract upgrade:BigBang --network <net>
pnpm contract upgrade:FractionToken --network <net>
pnpm contract upgrade:ThanksTokenImpl --network <net>
```

Hardhat tasks (registered in `tasks/index.ts`) are exposed as scripts:

```
pnpm contract bigbang --owner ... --tophatdetails ... --network <net>     # spin up a workspace
pnpm contract mintHat --hatid <id> --wearer <addr> --module <addr> --network <net>
pnpm contract batchMintHat --hatid <id> --csv ./data/x.csv --module <addr> --network <net>
pnpm contract getWoreTime --wearer <addr> --network <net>
pnpm contract getBalance --network <net>
pnpm contract getChainInfo --network <net>
pnpm contract getContractAddress --contract <Name> --network <net>
pnpm contract registerSubdomain --label <label> --network <net>
```

To run a single test: `pnpm contract test mocha test/BigBang.ts` (use `--grep "<pattern>"` for a single case). Add `--gas-stats` for a gas report.

Dry-run a deploy/upgrade script without broadcasting: use a throwaway config that spreads `hardhat.config.ts` and overrides `sepolia` with `type: "edr-simulated"` + `forking.url`, then `npx hardhat --config <it> run --network sepolia scripts/...`. The network name stays `sepolia`, so the script **rewrites `outputs/contracts-sepolia.json`** — restore it with git afterwards.

## Networks

Defined in `hardhat.config.ts`:
- `default` (in-process EDR, `allowUnlimitedContractSize`; Hardhat 2 called this `hardhat`) and `localhost` (for `pnpm contract local`)
- `sepolia` — uses `PRIVATE_KEY` + `ALCHEMY_API_KEY`
- `holesky` — uses `PRIVATE_KEY` + `ALCHEMY_API_KEY`
- `base` — uses `PRODUCTION_PRIVATE_KEY` (separate from testnet key)

Keys and RPC URLs are `configVariable`s, resolved only when that network is used (from `.env` via `dotenv`). With no `PRIVATE_KEY` / `PRODUCTION_PRIVATE_KEY` in the env the network has no accounts, so read-only tasks still work. Verification uses the single `ETHERSCAN_API_KEY` (Etherscan API v2, multichain); Blockscout / Sourcify are disabled to match Hardhat 2.

## Contract layout (`contracts/`)

- `bigbang/BigBang.sol` — UUPS-upgradeable workspace bootstrapper. Its `Executed` event is the *seed* event for the subgraph; everything else is templated off the addresses BigBang emits.
- `hats/` — wrappers / interfaces for Hats Protocol.
- `hatsmodules/` — Hats modules deployed per-workspace via `HatsModuleFactory`:
  - `timeframe/HatsTimeFrameModule.sol` — records when a wearer received a hat (drives Splits weighting).
  - `hatcreator/HatsHatCreatorModule.sol` — delegated child-hat creation.
  - `fractiontoken/HatsFractionTokenModule.sol` — per-role share token (the v3 module form of the old standalone FractionToken).
  - `quest/HatsQuestModule.sol` — quest issuance, integrates with Splits.
- `splitscreator/` — `SplitsCreatorFactory` deploys per-workspace `SplitsCreator` contracts that compute splits from time-weighted role wear. `ISplitsCreator.sol` defines the interface.
- `splits/` — 0xSplits interfaces/wrappers the creator builds on.
- `scheduleddistributor/` — `ScheduledDistributorFactory` + per-workspace `ScheduledDistributor` (recurring distributions). Indexed by the subgraph as both a seed contract and a template.
- `thankstoken/` — standalone `ThanksToken` + factory (P2P transferable assist credit). Note the README's terminology overlap: `FractionToken` (standalone, legacy), `HatsFractionTokenModule` (current per-role share), and `ThanksToken` are distinct contracts that have all been called "Thanks Token" / "Assist Credit" / "Role Share" at various points.
- `utils/` — shared libraries.

## Deployment pipeline (`scripts/deploy/create2.ts`)

`deploy:all` performs a CREATE2-style deterministic deploy of every implementation and factory in one script, then writes addresses to **`outputs/contracts-<network>.json`** (`contracts-sepolia.json` / `contracts-base.json` / `contracts-holesky.json`) via `helpers/deploy/contractsJsonHelper.ts`. Helpers in `helpers/deploy/` (one per contract group: `BigBang`, `Hats`, `Splits`, `ThanksToken`, `ScheduledDistributor`, `Create2Factory`, `Upgradeable`) encapsulate the actual `deployProxy` / `deployContract` calls — extend those rather than inlining new logic in scripts.

Per-workspace deployment (deploying a `BigBang` *invocation*) goes through `pnpm contract bigbang` — that's the on-chain bootstrap path users hit.

## Tests (`test/`)

Mocha + chai with viem matchers. Each top-level contract has its own file. `IntegrationTest.ts` exercises the full BigBang → modules → splits flow — read it first to understand contract wiring before changing module APIs.

## Required env (`pkgs/contract/.env`)

```
PRIVATE_KEY=
PRODUCTION_PRIVATE_KEY=
ETHERSCAN_API_KEY=
BASESCAN_API_KEY=
ALCHEMY_API_KEY=
HATS_ADDRESS=
HATS_MODULE_FACTORY_ADDRESS=
PULL_SPLITS_FACTORY_ADDRESS=
```

## Conventions

- New upgradeable contract → use `initializer` (no constructors), implement `_authorizeUpgrade`, add a matching helper in `helpers/deploy/`.
- New event → add it to the relevant subgraph mapping (`pkgs/subgraph/src/*Mapping.ts`) and update `pkgs/subgraph/config/{sepolia,base}.json` so it's wired into the deployed subgraph.
- Address bookkeeping for deployed contracts is in `outputs/` (per-network JSON). Don't hand-edit those — they're regenerated by deploy scripts.
