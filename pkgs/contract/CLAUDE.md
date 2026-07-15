# CLAUDE.md — pkgs/contract

Guidance for the Toban smart contracts. Repo-root `CLAUDE.md` covers monorepo concerns and the cross-package domain model; this file is contract-specific.

## Stack

- **Hardhat** with the Viem toolbox (`@nomicfoundation/hardhat-toolbox-viem`) plus `hardhat-ethers` (some deploy scripts still use ethers signers — both are wired).
- **Solidity 0.8.24** with `viaIR: true`, optimizer runs `200`, evmVersion `cancun` (see `hardhat.config.ts`).
- **OpenZeppelin Upgradeable** (`@openzeppelin/contracts-upgradeable` 5.0.2) — UUPS pattern for `BigBang` and `FractionToken`-family contracts.
- **OpenZeppelin Hardhat Upgrades** plugin for proxy deploys/upgrades (`scripts/upgrade/*`).
- **Hats Protocol v1** (`@hatsprotocol/sdk-v1-core`) and **0xSplits** are external dependencies — Toban deploys *modules* and *creators* that plug into them.
- **solhint** (`pnpm contract lint`) for Solidity linting. Biome handles TS scripts/tests. Note: `biome.json` excludes `contract/test` from lint and `contract/artifacts`/`contract/cache` from everything.

## Commands

```
pnpm contract compile            # hardhat compile
pnpm contract test               # hardhat test (mocha + viem matchers)
pnpm contract coverage           # solidity-coverage
pnpm contract clean              # hardhat clean
pnpm contract lint               # solhint --fix
pnpm contract local              # local hardhat node
pnpm contract deploy:all --network <net>          # CREATE2 deploy of all impls + factories
pnpm contract upgrade:BigBang --network <net>
pnpm contract upgrade:FractionToken --network <net>
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

To run a single test: `pnpm contract test test/BigBang.ts` (Hardhat forwards to Mocha; use `--grep "<pattern>"` for a single case).

## Networks

Defined in `hardhat.config.ts`:
- `hardhat` (local, `allowUnlimitedContractSize`)
- `sepolia` — uses `PRIVATE_KEY` + `ALCHEMY_API_KEY`
- `holesky` — uses `PRIVATE_KEY` + `ALCHEMY_API_KEY`
- `base` — uses `PRODUCTION_PRIVATE_KEY` (separate from testnet key)

Etherscan/Basescan keys are split between `ETHERSCAN_API_KEY` (Sepolia/Holesky) and `BASESCAN_API_KEY` (Base).

## Contract layout (`contracts/`)

- `bigbang/BigBang.sol` — UUPS-upgradeable workspace bootstrapper. Its `Executed` event is the *seed* event for the subgraph; everything else is templated off the addresses BigBang emits.
- `hats/` — wrappers / interfaces for Hats Protocol.
- `hatsmodules/` — Hats modules deployed per-workspace via `HatsModuleFactory`:
  - `timeframe/HatsTimeFrameModule.sol` — records when a wearer received a hat (drives Splits weighting).
  - `hatcreator/HatsHatCreatorModule.sol` — delegated child-hat creation.
  - `fractiontoken/HatsFractionTokenModule.sol` — per-role share token (the v3 module form of the old standalone FractionToken).
  - `quest/HatsQuestModule.sol` — quest issuance, integrates with Splits.
- `splitscreator/` — `SplitsCreatorFactory` deploys per-workspace `SplitsCreator` contracts that compute splits from time-weighted role wear. `ISplitsCreator.sol` defines the interface.
- `thankstoken/` — standalone `ThanksToken` + factory (P2P transferable assist credit). Note the README's terminology overlap: `FractionToken` (standalone, legacy), `HatsFractionTokenModule` (current per-role share), and `ThanksToken` are distinct contracts that have all been called "Thanks Token" / "Assist Credit" / "Role Share" at various points.
- `utils/` — shared libraries.

## Deployment pipeline (`scripts/deploy/create2.ts`)

`deploy:all` performs a CREATE2-style deterministic deploy of every implementation and factory in one script, then writes addresses to `outputs/contracts.json` via `helpers/deploy/contractsJsonHelper.ts`. Helpers in `helpers/deploy/` (one per contract group: `BigBang`, `Hats`, `Splits`, `ThanksToken`) encapsulate the actual `deployProxy` / `deployContract` calls — extend those rather than inlining new logic in scripts.

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
COINMARKETCAP_API_KEY=
GAS_REPORT=
HATS_ADDRESS=
HATS_MODULE_FACTORY_ADDRESS=
PULL_SPLITS_FACTORY_ADDRESS=
```

## Conventions

- New upgradeable contract → use `initializer` (no constructors), implement `_authorizeUpgrade`, add a matching helper in `helpers/deploy/`.
- New event → add it to the relevant subgraph mapping (`pkgs/subgraph/src/*Mapping.ts`) and update `pkgs/subgraph/config/{sepolia,base}.json` so it's wired into the deployed subgraph.
- Address bookkeeping for deployed contracts is in `outputs/` (per-network JSON). Don't hand-edit those — they're regenerated by deploy scripts.
