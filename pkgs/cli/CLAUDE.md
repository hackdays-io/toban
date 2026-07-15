# CLAUDE.md — pkgs/cli

Operator/dev CLI for interacting with deployed Toban contracts. Repo-root `CLAUDE.md` has the cross-package context.

## Stack

- **commander** for argv parsing; one subcommand group per contract (`bigbang`, `hats`, `wallet`, `splits`, `pinata`, `fractionToken`).
- **viem** for chain calls; **`@hatsprotocol/sdk-v1-core`** + **`@hatsprotocol/sdk-v1-subgraph`** for Hats reads.
- **zod** for command-input validation.
- **TypeScript** compiled with `tsc` to `dist/`. Binary entry: `dist/index.js` (registered as `bin: toban`).

## Commands

```
pnpm cli build                 # tsc → dist/
pnpm cli start                 # build + run dist/index.js (no args; equivalent to `toban --help`)
pnpm cli hat:sample            # ts-node ./scripts/hat.ts (dev sample)
```

After `pnpm cli build`, invoke through the workspace alias:

```
pnpm cli toban <group> <command> [options]
pnpm cli toban hats list --treeId 163
pnpm cli toban hats wears --hatId 0x000000a3...
pnpm cli toban hats wear --address 0xfedfa388...
```

Global flags (defined in `src/index.ts`): `--chain <chainId>` (default `11155111` Sepolia), `--profile <name>` (wallet profile selector).

## Architecture

- `src/index.ts` — root program. A `preAction` hook lazy-initializes `publicClient` / `walletClient` for any command **not** listed in `skipPreActionCommands` (`src/config.ts`). Read-only commands and `wallet:*` setup commands skip wallet init to avoid unnecessary prompts.
- `src/commands/<group>.ts` — commander definitions; argv → zod validation → call into `modules/`.
- `src/modules/<contract>.ts` — viem-based contract interaction (the equivalent of the frontend's `hooks/`).
- `src/services/` — cross-cutting concerns: `wallet.ts` (profile-based key loading), `pinata.ts` (IPFS uploads), `loading.ts` (spinner UX).
- `src/abi/` — bundled ABIs.

## Adding a new command

1. Add the contract module under `src/modules/` (viem `getContract` etc.).
2. Add the commander group under `src/commands/`.
3. Register the group in `src/index.ts` via `rootProgram.addCommand(...)`.
4. If the command is read-only and shouldn't trigger wallet init, add `"<group>><command>"` to `skipPreActionCommands` in `src/config.ts`.

## Env

`pkgs/cli/.env` — same chain/Alchemy/Pinata keys as the contract package; the worktree bootstrap copies it from the main repo.
