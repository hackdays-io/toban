/**
 * viem public client + ThanksToken ABI fragment.
 *
 * IMPORTANT — ABI fragment is a placeholder.
 *
 * The authoritative ABI is produced by agent A (#506 contract) once that
 * PR lands. Until then we hand-roll the minimum fragment needed for
 * `/thx` and `/balance`. Differences expected at integration time:
 *
 *   - The `RelatedRole` struct's exact field names (we use `hatId`,
 *     `wearTime` as placeholders — agent A may name them differently).
 *   - Additional MintFrom event topics (e.g. memo/tag) that the subgraph
 *     will start indexing.
 *   - `mintAllowance` may be renamed (e.g. `allowance(owner, spender)`).
 *
 * When the real ABI lands, replace this fragment ONLY here. `chain.ts`
 * is the single source of truth for ABI in this package — every command
 * imports {@link THANKS_TOKEN_ABI} from this module.
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

// TODO(#506-integration): replace with `pkgs/contract/artifacts/.../ThanksToken.json`
//   abi export once #506 lands. Until then, struct field names are placeholders.
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
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      {
        name: "relatedRoles",
        type: "tuple[]",
        components: [
          { name: "hatId", type: "uint256" },
          { name: "wearTime", type: "uint256" },
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
          { name: "wearTime", type: "uint256" },
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

/** Placeholder used by `/thx` until real role-context plumbing lands. */
export const EMPTY_RELATED_ROLES: readonly {
  hatId: bigint;
  wearTime: bigint;
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
