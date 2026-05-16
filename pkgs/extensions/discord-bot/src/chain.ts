/**
 * viem public client + ThanksToken ABI fragment.
 *
 * The full ABI is produced by `pkgs/contract` (#506). This module exposes
 * only the slice the bot calls (`mintAllowance`, `mintableAmount`,
 * `mintFrom`) plus the `MintFrom` event for indexer reference. When the
 * contract's ABI changes, update only this file — every command imports
 * {@link THANKS_TOKEN_ABI} from here.
 */
import {
  http,
  type Hex,
  type PublicClient,
  createPublicClient,
  defineChain,
} from "viem";
import { base, sepolia } from "viem/chains";
import type { Env } from "./env";

export const THANKS_TOKEN_ABI = [
  {
    type: "function",
    name: "mintAllowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintableAmount",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      {
        name: "relatedRoles",
        type: "tuple[]",
        components: [
          { name: "hatId", type: "uint256" },
          { name: "wearer", type: "address" },
        ],
      },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      {
        name: "relatedRoles",
        type: "tuple[]",
        components: [
          { name: "hatId", type: "uint256" },
          { name: "wearer", type: "address" },
        ],
      },
      { name: "data", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  // Event included for reference — subgraph indexers will consume it.
  {
    type: "event",
    name: "MintFrom",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

/**
 * MVP `/thx` sends `relatedRoles = []`. `mintableAmount(owner, [])` falls
 * back to the address-coefficient cap (see ThanksToken.sol), which is the
 * defensive boundary we want until role-context plumbing arrives.
 */
export const EMPTY_RELATED_ROLES: readonly {
  hatId: bigint;
  wearer: `0x${string}`;
}[] = [];

export function getChain(env: Env) {
  const id = Number(env.CHAIN_ID);
  if (id === base.id) return base;
  if (id === sepolia.id) return sepolia;
  // Allow exotic / local chains without crashing.
  return defineChain({
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [env.RPC_URL] } },
  });
}

export function getPublicClient(env: Env): PublicClient {
  // viem narrows the return type by chain; widen back to the generic
  // PublicClient so the rest of the package doesn't have to thread
  // chain generics through every call site.
  return createPublicClient({
    chain: getChain(env),
    transport: http(env.RPC_URL),
  }) as unknown as PublicClient;
}

export function thanksTokenAddress(env: Env): Hex {
  return env.THANKS_TOKEN_ADDRESS as Hex;
}
