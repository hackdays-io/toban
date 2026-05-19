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
  type Address,
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

/**
 * Resolve a workspace's current ThanksToken address from Goldsky.
 *
 * Each workspace owns its own ThanksToken clone (and may switch to a
 * fresh contract via `BigBang.switchThanksToken`), so we never hardcode
 * a single address. The subgraph's `Workspace.thanksToken.id` is the
 * authoritative source.
 *
 * Returns `null` when the workspace isn't indexed yet or has no
 * ThanksToken associated. Callers should treat that as a user-facing
 * error ("workspace not initialised").
 */
export async function resolveThanksTokenAddress(
  env: Env,
  treeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Hex | null> {
  const endpoint = env.GOLDSKY_GRAPHQL_ENDPOINT;
  if (!endpoint) {
    throw new Error("GOLDSKY_GRAPHQL_ENDPOINT is not configured");
  }
  const res = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: "query($id: ID!) { workspace(id: $id) { thanksToken { id } } }",
      variables: { id: treeId },
    }),
  });
  if (!res.ok) {
    throw new Error(
      `subgraph workspace lookup failed: ${res.status} ${res.statusText}`,
    );
  }
  const body = (await res.json()) as {
    data?: { workspace?: { thanksToken?: { id?: string } | null } | null };
    errors?: Array<{ message: string }>;
  };
  if (body.errors?.length) {
    throw new Error(
      `subgraph workspace lookup errored: ${body.errors.map((e) => e.message).join("; ")}`,
    );
  }
  const id = body.data?.workspace?.thanksToken?.id;
  return id ? (id as Hex) : null;
}

/**
 * The Hats subgraph stores tree IDs as 8-hex-digit, 0x-prefixed strings
 * ("0x00000bba" for decimal 3002). The Toban subgraph uses the decimal
 * form. This helper converts the decimal treeId we get from
 * platform_links to the hex form the Hats subgraph expects.
 */
function treeIdToHatsHex(treeId: string): string {
  const decimal = BigInt(treeId);
  return `0x${decimal.toString(16).padStart(8, "0")}`;
}

/**
 * Resolve the role-context array required by ThanksToken's
 * `mintableAmount` / `mintFrom`. The contract sums up
 * `(wearingTime/10min) * shareBalance / shareTotalSupply` across each
 * (hatId, wearer) pair plus a flat 10% of the sender's THX balance.
 *
 * Mirrors `frontend/hooks/useThanksToken`: combine
 *   (a) FractionToken balances the sender owns (Toban subgraph),
 *   (b) hats the sender wears in this workspace (Hats subgraph).
 * (b) is necessary because freshly-minted hats are not always indexed
 * promptly in (a); the on-chain FractionToken balance still resolves
 * correctly when passed (hatId, wearer=self).
 */
export async function resolveRelatedRoles(
  env: Env,
  owner: Address,
  treeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<readonly { hatId: bigint; wearer: Address }[]> {
  if (!env.GOLDSKY_GRAPHQL_ENDPOINT) {
    throw new Error("GOLDSKY_GRAPHQL_ENDPOINT is not configured");
  }
  if (!env.HATS_GRAPHQL_ENDPOINT) {
    throw new Error("HATS_GRAPHQL_ENDPOINT is not configured");
  }

  const ownerLower = owner.toLowerCase();

  // (a) FractionToken balances from the Toban subgraph.
  const tobanRes = await fetchImpl(env.GOLDSKY_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query:
        "query($owner: String!, $workspaceId: String!) {" +
        " balanceOfFractionTokens(where: {owner: $owner, workspaceId: $workspaceId}, first: 200) {" +
        " hatId wearer } }",
      variables: { owner: ownerLower, workspaceId: treeId },
    }),
  });
  if (!tobanRes.ok) {
    throw new Error(
      `Toban subgraph relatedRoles lookup failed: ${tobanRes.status} ${tobanRes.statusText}`,
    );
  }
  const tobanBody = (await tobanRes.json()) as {
    data?: {
      balanceOfFractionTokens?: Array<{ hatId: string; wearer: string }>;
    };
    errors?: Array<{ message: string }>;
  };
  if (tobanBody.errors?.length) {
    throw new Error(
      `Toban subgraph errored: ${tobanBody.errors.map((e) => e.message).join("; ")}`,
    );
  }
  const fractionRows = tobanBody.data?.balanceOfFractionTokens ?? [];

  // (b) Hats the user wears, from the Hats subgraph.
  const hatsRes = await fetchImpl(env.HATS_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query:
        "query($treeId: ID!) {" +
        " tree(id: $treeId) { hats { id wearers { id } } } }",
      variables: { treeId: treeIdToHatsHex(treeId) },
    }),
  });
  if (!hatsRes.ok) {
    throw new Error(
      `Hats subgraph lookup failed: ${hatsRes.status} ${hatsRes.statusText}`,
    );
  }
  const hatsBody = (await hatsRes.json()) as {
    data?: {
      tree?: {
        hats?: Array<{ id: string; wearers: Array<{ id: string }> }>;
      } | null;
    };
    errors?: Array<{ message: string }>;
  };
  if (hatsBody.errors?.length) {
    throw new Error(
      `Hats subgraph errored: ${hatsBody.errors.map((e) => e.message).join("; ")}`,
    );
  }
  const myHats = (hatsBody.data?.tree?.hats ?? []).filter((h) =>
    h.wearers.some((w) => w.id.toLowerCase() === ownerLower),
  );

  // Combine. De-duplicate by (hatId, wearer) string key — the same pair
  // could in principle appear in both feeds.
  const map = new Map<string, { hatId: bigint; wearer: Address }>();
  for (const r of fractionRows) {
    const key = `${r.hatId}:${r.wearer.toLowerCase()}`;
    map.set(key, {
      hatId: BigInt(r.hatId),
      wearer: r.wearer as Address,
    });
  }
  for (const h of myHats) {
    const key = `${h.id}:${ownerLower}`;
    map.set(key, {
      hatId: BigInt(h.id),
      wearer: owner,
    });
  }
  return Array.from(map.values());
}
