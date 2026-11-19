import { network } from "hardhat";

/**
 * The single network connection shared by helpers, scripts and tests.
 *
 * Hardhat 3 no longer exposes `viem` / `ethers` on the global runtime; they
 * live on a connection. Connecting once at module load keeps the Hardhat 2
 * behaviour the codebase was written for: every caller in a process talks to
 * the same chain (`--network <name>`, or the in-process `default` network).
 *
 * Do not import this from `hardhat.config.ts` or task definitions — only from
 * task *actions*, scripts and tests, which run after the runtime is ready.
 */
export const connection = await network.getOrCreate();

export const { viem, ethers, networkHelpers, networkName } = connection;
