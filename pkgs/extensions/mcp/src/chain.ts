/**
 * viem public client + a **view-only** ThanksToken ABI fragment.
 *
 * This is a second copy of the slice already in
 * `pkgs/extensions/discord-bot/src/chain.ts` — a known, accepted cost of the
 * MCP extraction (`docs/mcp-extraction.md` §8 "既知のコスト"). The two
 * fragments cannot be unified into a shared import without creating a
 * runtime dependency from `@toban/mcp` on `@toban/discord-bot`'s source,
 * which the workspace-boundary rule in the root CLAUDE.md forbids.
 *
 * The split that matters: **only `view` functions live here.**
 * `mintFrom` / `submitCompletion` (state-changing) stay exclusively in
 * discord-bot's `chain.ts`, which remains the single source of truth for
 * *write* selectors — see `pkgs/extensions/discord-bot/CLAUDE.md`. Nothing
 * in this file can reach the chain except by reading it.
 */
import {
  http,
  type Address,
  type PublicClient,
  createPublicClient,
  defineChain,
} from "viem";
import { base, sepolia } from "viem/chains";
import type { Env } from "./env.js";

/** View-only slice of ThanksToken — never add a state-changing function here. */
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
] as const;

export function getChain(env: Env) {
  const id = Number(env.CHAIN_ID);
  if (id === base.id) return base;
  if (id === sepolia.id) return sepolia;
  return defineChain({
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [env.RPC_URL] } },
  });
}

export function getPublicClient(env: Env): PublicClient {
  return createPublicClient({
    chain: getChain(env),
    transport: http(env.RPC_URL),
  }) as unknown as PublicClient;
}

/**
 * POST a GraphQL `query` to `endpoint` and return its `data`. Identical
 * contract to discord-bot's `postGraphQL` (same error-shape handling), kept
 * as its own copy for the same workspace-boundary reason as the ABI above.
 */
export async function postGraphQL<T>(
  endpoint: string | undefined,
  envVarName: string,
  query: string,
  variables: Record<string, unknown>,
  fetchImpl: typeof fetch,
  label: string,
): Promise<T> {
  if (!endpoint) {
    throw new Error(`${envVarName} is not configured`);
  }
  const res = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`${label} failed: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (body.errors?.length) {
    throw new Error(
      `${label} errored: ${body.errors.map((e) => e.message).join("; ")}`,
    );
  }
  return body.data as T;
}

/**
 * The Hats subgraph stores tree IDs as 8-hex-digit, 0x-prefixed strings
 * ("0x00000bba" for decimal 3002). The Toban subgraph uses the decimal
 * form. Identical helper to discord-bot's `treeIdToHatsHex`.
 */
export function treeIdToHatsHex(treeId: string): string {
  const decimal = BigInt(treeId);
  return `0x${decimal.toString(16).padStart(8, "0")}`;
}

/**
 * Hats currently worn by `owner` in `treeId`, from the Hats subgraph — the
 * second, genuinely-different endpoint `toban_member_status` needs. The
 * Toban-subgraph half of the same role picture (FractionToken balances)
 * used to be fetched here too (as `resolveRelatedRoles`), but that was a
 * separate Goldsky round-trip alongside two others `toban_member_status`
 * already made to the same endpoint; it now comes from
 * `resolveMemberStatusGoldskyData` in `queries.ts`, which folds all three
 * Goldsky reads into one aliased query. Merge the two halves with
 * `mergeRelatedRoles` below.
 */
export async function fetchWornHats(
  env: Env,
  owner: Address,
  treeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Array<{ id: string }>> {
  if (!env.HATS_GRAPHQL_ENDPOINT) {
    throw new Error("HATS_GRAPHQL_ENDPOINT is not configured");
  }
  const ownerLower = owner.toLowerCase();
  const data = await postGraphQL<{
    tree?: {
      hats?: Array<{ id: string; wearers: Array<{ id: string }> }>;
    } | null;
  }>(
    env.HATS_GRAPHQL_ENDPOINT,
    "HATS_GRAPHQL_ENDPOINT",
    "query($treeId: ID!) {" +
      " tree(id: $treeId) { hats { id wearers { id } } } }",
    { treeId: treeIdToHatsHex(treeId) },
    fetchImpl,
    "Hats subgraph lookup",
  );
  return (data.tree?.hats ?? []).filter((h) =>
    h.wearers.some((w) => w.id.toLowerCase() === ownerLower),
  );
}

/**
 * Merge FractionToken balances (Toban subgraph) with hats currently worn
 * (Hats subgraph, `fetchWornHats`) into the role-context array ThanksToken's
 * `mintableAmount` requires. A freshly-minted hat may not be indexed by the
 * Toban subgraph yet, so `mintableAmount` must not under-count — hence the
 * merge rather than trusting either source alone. Pure (no I/O), so the
 * caller can source `fractionRows` from whichever query already has them.
 */
export function mergeRelatedRoles(
  fractionRows: readonly { hatId: string; wearer: string }[],
  wornHats: readonly { id: string }[],
  owner: Address,
): readonly { hatId: bigint; wearer: Address }[] {
  const ownerLower = owner.toLowerCase();
  const keyFor = (hatId: string | bigint, wearer: string) =>
    `${BigInt(hatId).toString(16)}:${wearer.toLowerCase()}`;
  const map = new Map<string, { hatId: bigint; wearer: Address }>();
  for (const r of fractionRows) {
    map.set(keyFor(r.hatId, r.wearer), {
      hatId: BigInt(r.hatId),
      wearer: r.wearer as Address,
    });
  }
  for (const h of wornHats) {
    map.set(keyFor(h.id, ownerLower), { hatId: BigInt(h.id), wearer: owner });
  }
  return Array.from(map.values());
}

/**
 * Resolve a hat the `wallet` wears in the workspace tree, as the 256-bit hat
 * id. Returns `null` when the wallet wears no hat in the tree. Identical to
 * discord-bot's `resolveMembershipHatId` — used by `toban_open_quests` to
 * check whether a Discord user may submit completion.
 */
export async function resolveMembershipHatId(
  env: Env,
  wallet: Address,
  treeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<bigint | null> {
  const expectedTreeHex = treeIdToHatsHex(treeId);
  const data = await postGraphQL<{
    wearer?: {
      currentHats?: Array<{ id: string; tree?: { id: string } | null }>;
    } | null;
  }>(
    env.HATS_GRAPHQL_ENDPOINT,
    "HATS_GRAPHQL_ENDPOINT",
    "query($wearer: ID!) {" +
      " wearer(id: $wearer) { currentHats { id tree { id } } } }",
    { wearer: wallet.toLowerCase() },
    fetchImpl,
    "Hats subgraph wearer lookup",
  );
  const hat = (data.wearer?.currentHats ?? []).find(
    (h) => (h.tree?.id ?? "").toLowerCase() === expectedTreeHex,
  );
  return hat ? BigInt(hat.id) : null;
}

/**
 * Does `wallet` currently wear any hat in `candidateHatIds` (decimal
 * strings, as they come back from the Toban subgraph's `Workspace` entity —
 * `operatorHatId` / `topHatId`)?
 *
 * Used only by token issuance (`handlers/issue.ts`) to check "does this
 * wallet hold the workspace's operator or top hat". Reads the Hats subgraph
 * directly rather than reusing `resolveMembershipHatId` because that
 * function answers "wears *some* hat in the tree", not "wears *this specific*
 * hat" — issuance must not authorise every member, only operators/owners.
 */
export async function wearsAnyOfHats(
  env: Env,
  wallet: Address,
  treeId: string,
  candidateHatIds: readonly string[],
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const candidates = new Set(candidateHatIds.map((h) => BigInt(h).toString()));
  if (candidates.size === 0) return false;
  const data = await postGraphQL<{
    wearer?: {
      currentHats?: Array<{ id: string; tree?: { id: string } | null }>;
    } | null;
  }>(
    env.HATS_GRAPHQL_ENDPOINT,
    "HATS_GRAPHQL_ENDPOINT",
    "query($wearer: ID!) {" +
      " wearer(id: $wearer) { currentHats { id tree { id } } } }",
    { wearer: wallet.toLowerCase() },
    fetchImpl,
    "Hats subgraph wearer lookup",
  );
  const expectedTreeHex = treeIdToHatsHex(treeId);
  return (data.wearer?.currentHats ?? []).some(
    (h) =>
      (h.tree?.id ?? "").toLowerCase() === expectedTreeHex &&
      candidates.has(BigInt(h.id).toString()),
  );
}
