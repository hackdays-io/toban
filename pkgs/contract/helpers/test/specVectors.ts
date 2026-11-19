/**
 * Shared by the differential tests (test/*.Differential.ts): load a test
 * vector file generated from the Lean models in pkgs/spec (`pnpm spec vectors`).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/** `pkgs/spec/vectors/<name>.json`, parsed. */
export const loadVectors = <T>(name: string): T =>
  JSON.parse(
    readFileSync(
      createRequire(import.meta.url).resolve(
        `@toban/spec/vectors/${name}.json`,
      ),
      "utf8",
    ),
  ) as T;

/** viem's messages for Solidity panics 0x11 and 0x12. */
export const panicMessage = {
  overflow: /Arithmetic operation resulted in underflow or overflow/,
  divZero: /Division or modulo by zero/,
};
