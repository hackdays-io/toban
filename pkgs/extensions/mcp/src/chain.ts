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
  type Hex,
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
 * Resolve a workspace's current ThanksToken address from Goldsky. Each
 * workspace owns its own clone (`BigBang.switchThanksToken`), so this is
 * never hardcoded. Returns `null` when the tree isn't indexed yet.
 */
export async function resolveThanksTokenAddress(
  env: Env,
  treeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Hex | null> {
  const data = await postGraphQL<{
    workspace?: { thanksToken?: { id?: string } | null } | null;
  }>(
    env.GOLDSKY_GRAPHQL_ENDPOINT,
    "GOLDSKY_GRAPHQL_ENDPOINT",
    "query($id: ID!) { workspace(id: $id) { thanksToken { id } } }",
    { id: treeId },
    fetchImpl,
    "subgraph workspace lookup",
  );
  const id = data.workspace?.thanksToken?.id;
  return id ? (id as Hex) : null;
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
 * Resolve the role-context array required by ThanksToken's
 * `mintableAmount`. Mirrors discord-bot's `resolveRelatedRoles` exactly
 * (combines FractionToken balances from the Toban subgraph with hats worn,
 * from the Hats subgraph, because a freshly-minted hat may not be indexed
 * in the former yet).
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

  const fetchFractionRows = async (): Promise<
    Array<{ hatId: string; wearer: string }>
  > => {
    const data = await postGraphQL<{
      balanceOfFractionTokens?: Array<{ hatId: string; wearer: string }>;
    }>(
      env.GOLDSKY_GRAPHQL_ENDPOINT,
      "GOLDSKY_GRAPHQL_ENDPOINT",
      "query($owner: String!, $workspaceId: String!) {" +
        " balanceOfFractionTokens(where: {owner: $owner, workspaceId: $workspaceId}, first: 200) {" +
        " hatId wearer } }",
      { owner: ownerLower, workspaceId: treeId },
      fetchImpl,
      "Toban subgraph relatedRoles lookup",
    );
    return data.balanceOfFractionTokens ?? [];
  };

  const fetchWornHats = async (): Promise<Array<{ id: string }>> => {
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
  };

  const [fractionRows, myHats] = await Promise.all([
    fetchFractionRows(),
    fetchWornHats(),
  ]);

  const keyFor = (hatId: string | bigint, wearer: string) =>
    `${BigInt(hatId).toString(16)}:${wearer.toLowerCase()}`;
  const map = new Map<string, { hatId: bigint; wearer: Address }>();
  for (const r of fractionRows) {
    map.set(keyFor(r.hatId, r.wearer), {
      hatId: BigInt(r.hatId),
      wearer: r.wearer as Address,
    });
  }
  for (const h of myHats) {
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
