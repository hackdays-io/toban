import { network } from "hardhat";

/**
 * The single network connection shared by helpers, scripts and tests.
 *
 * `viem` / `ethers` live on a network connection, not on the global runtime.
 * Connecting once at module load means every caller in a process talks to the
 * same chain (`--network <name>`, or the in-process `default` network).
 *
 * Do not import this from `hardhat.config.ts` or task definitions — only from
 * task *actions*, scripts and tests, which run after the runtime is ready.
 */
export const connection = await network.getOrCreate();

export const { viem, ethers, networkHelpers, networkName } = connection;
