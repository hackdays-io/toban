/**
 * Read-only Goldsky (Toban subgraph) queries behind the MCP read tools.
 *
 * Deliberately separate from `chain.ts`: that module holds the ABI slice and
 * the resolvers the **write** paths depend on (`/thx`, `/quest submit`), and
 * stays small so it can be audited next to `turnkey/policy.json`. Nothing in
 * this file can reach the chain — every function is a GraphQL read.
 *
 * Two invariants every query here must keep:
 *
 * 1. **Workspace scoping is not optional.** The caller's MCP token pins a
 *    guild, which pins one `treeId`; every filter carries it, so a tool can
 *    never return another workspace's rows whatever the model emits.
 * 2. **Every list is bounded.** Results land in a third-party agent's context
 *    window, so each query takes an explicit `first` — see {@link clampLimit}.
 *
 * Amount units differ per entity and are NOT interchangeable:
 *   - ThanksToken amounts are 18-decimal → formatted with `formatEther`.
 *   - FractionToken/role-share and quest amounts are raw share counts
 *     (`FractionToken` mints a fixed 10000-unit supply per role) → returned
 *     as-is, matching how the frontend renders them (`BigInt(x).toLocaleString()`).
 *   - ScheduledDistributor amounts are arbitrary ERC-20s whose decimals the
 *     subgraph does not index → returned raw, and named `*Raw` to say so.
 */
import { type Address, type Hex, formatEther, hexToString } from "viem";
import { postGraphQL } from "../chain";
import type { Env } from "../env";

/**
 * The three units the indexer's amounts come in, and what a reader may do
 * with each.
 *
 * These notes ride along in the tool response rather than living only in the
 * docs: a third-party agent reads the JSON, and the failure we are guarding
 * against — adding a role-share count to a THX total, or reporting a raw
 * ERC-20 integer as a human amount — happens at read time, not at
 * integration time. Keeping the note next to the number is the only place it
 * is guaranteed to be seen.
 */
export const UNIT_NOTES = {
  thx: "サンクストークン。小数に換算済みなので、そのまま合計・比較・平均してよい。",
  shares:
    "ロールシェアの個数（整数）。1 ロールあたりの総供給が 10000 なので、割合を出すなら 10000 を分母にする。THX とは別の単位なので、足したり大小を比べたりしてはいけない。",
  raw: "ERC-20 の最小単位そのまま。小数桁をインデクサーが持っていないため未換算。人間向けの金額にするにはそのトークンの decimals で割る必要があり、それが分からないうちは換算せず、生の値と『単位未確定』であることをそのまま伝える。",
} as const;

export type UnitKind = keyof typeof UNIT_NOTES;

/**
 * Build the `units` block a tool attaches to a response carrying amounts:
 * which field is in which unit, plus the note for each unit actually used.
 */
export function unitsFor(fields: Record<string, UnitKind>): {
  fields: Record<string, UnitKind>;
  notes: Partial<Record<UnitKind, string>>;
} {
  const notes: Partial<Record<UnitKind, string>> = {};
  for (const kind of Object.values(fields)) notes[kind] = UNIT_NOTES[kind];
  return { fields, notes };
}

/** Cap on any single list a tool may return. */
export const MAX_LIMIT = 100;

export function clampLimit(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }
  return Math.min(value, MAX_LIMIT);
}

const GOLDSKY = "GOLDSKY_GRAPHQL_ENDPOINT" as const;

function goldsky<T>(
  env: Env,
  query: string,
  variables: Record<string, unknown>,
  fetchImpl: typeof fetch,
  label: string,
): Promise<T> {
  return postGraphQL<T>(
    env.GOLDSKY_GRAPHQL_ENDPOINT,
    GOLDSKY,
    query,
    variables,
    fetchImpl,
    label,
  );
}

/** Unix-seconds string (as the subgraph stores timestamps) -> ISO 8601. */
export function toIso(seconds: string | null | undefined): string | null {
  if (!seconds) return null;
  const n = Number(seconds);
  if (!Number.isFinite(n)) return null;
  return new Date(n * 1000).toISOString();
}

/**
 * Decode a `MintThanksToken.data` blob back to the message the sender typed.
 *
 * `/thx` and the MCP confirm button both encode it as UTF-8 hex (see
 * `performThx`), but `mintFrom` is a public function — anyone can pass
 * arbitrary bytes, so this must never throw on garbage.
 */
export function decodeThanksMessage(data: string | null | undefined): string {
  if (!data || data === "0x") return "";
  let text: string;
  try {
    text = hexToString(data as Hex);
  } catch {
    return "";
  }
  // Strip C0/C1 control bytes. `mintFrom` is public, so `data` is whatever
  // the sender put on chain, and it ends up rendered into a Discord message.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: that is the intent
  return text.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim();
}

// -------------------------------------------------------------- workspace

export interface WorkspaceOverview {
  creator: string;
  owner: string;
  createdAt: string | null;
  hats: {
    topHatId: string;
    hatterHatId: string;
    memberHatId: string;
    operatorHatId: string;
    creatorHatId: string;
    minterHatId: string;
    questAgentHatId: string;
  };
  modules: {
    thanksToken: string;
    hatsTimeFrameModule: string;
    hatsHatCreatorModule: string;
    hatsFractionTokenModule: string;
    hatsQuestModule: string;
    splitsCreator: string;
  };
}

/**
 * The whole `Workspace` row, for `toban_workspace_info`.
 *
 * Returns `null` when the tree is not indexed yet — callers surface that as
 * "not initialised" rather than inventing addresses.
 */
export async function resolveWorkspaceOverview(
  env: Env,
  treeId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<WorkspaceOverview | null> {
  const data = await goldsky<{
    workspace?: {
      creator: string;
      owner: string;
      topHatId: string;
      hatterHatId: string;
      memberHatId: string;
      operatorHatId: string;
      creatorHatId: string;
      minterHatId: string;
      questAgentHatId: string;
      hatsTimeFrameModule: string;
      hatsHatCreatorModule: string;
      hatsQuestModule: string;
      splitCreator: string;
      blockTimestamp: string;
      thanksToken?: { id: string } | null;
      hatsFractionTokenModule?: { id: string } | null;
    } | null;
  }>(
    env,
    "query($id: ID!) { workspace(id: $id) {" +
      " creator owner topHatId hatterHatId memberHatId operatorHatId" +
      " creatorHatId minterHatId questAgentHatId hatsTimeFrameModule" +
      " hatsHatCreatorModule hatsQuestModule splitCreator blockTimestamp" +
      " thanksToken { id } hatsFractionTokenModule { id } } }",
    { id: treeId },
    fetchImpl,
    "subgraph workspace overview lookup",
  );
  const w = data.workspace;
  if (!w) return null;
  return {
    creator: w.creator,
    owner: w.owner,
    createdAt: toIso(w.blockTimestamp),
    hats: {
      topHatId: w.topHatId,
      hatterHatId: w.hatterHatId,
      memberHatId: w.memberHatId,
      operatorHatId: w.operatorHatId,
      creatorHatId: w.creatorHatId,
      minterHatId: w.minterHatId,
      questAgentHatId: w.questAgentHatId,
    },
    modules: {
      thanksToken: w.thanksToken?.id ?? "",
      hatsTimeFrameModule: w.hatsTimeFrameModule,
      hatsHatCreatorModule: w.hatsHatCreatorModule,
      hatsFractionTokenModule: w.hatsFractionTokenModule?.id ?? "",
      hatsQuestModule: w.hatsQuestModule,
      splitsCreator: w.splitCreator,
    },
  };
}

// ------------------------------------------------------------ thanks token

export interface ThanksTotals {
  /** THX this wallet has received, 18-decimal formatted. */
  balanceThx: string;
  /** THX this wallet has sent in total, 18-decimal formatted. */
  sentTotalThx: string;
  balanceUpdatedAt: string | null;
}

/**
 * Received balance + lifetime sent total for one wallet in one workspace.
 *
 * Distinct from the on-chain `mintAllowance` / `mintableAmount` reads in
 * `toban_member_status`: those are *capacity to send*, these are *history*.
 * Both are needed to answer "how much do I have / how much can I give".
 */
export async function resolveThanksTotals(
  env: Env,
  treeId: string,
  wallet: Address,
  fetchImpl: typeof fetch = fetch,
): Promise<ThanksTotals> {
  const owner = wallet.toLowerCase();
  const data = await goldsky<{
    balanceOfThanksTokens?: Array<{ balance: string; updatedAt: string }>;
    amountOfMintThanksTokens?: Array<{ amount: string }>;
  }>(
    env,
    "query($ws: ID!, $owner: String!) {" +
      " balanceOfThanksTokens(where: {workspaceId: $ws, owner: $owner}, first: 1) { balance updatedAt }" +
      " amountOfMintThanksTokens(where: {workspaceId: $ws, sender: $owner}, first: 1) { amount } }",
    { ws: treeId, owner },
    fetchImpl,
    "subgraph thanks totals lookup",
  );
  const bal = data.balanceOfThanksTokens?.[0];
  const sent = data.amountOfMintThanksTokens?.[0];
  return {
    balanceThx: formatEther(BigInt(bal?.balance ?? "0")),
    sentTotalThx: formatEther(BigInt(sent?.amount ?? "0")),
    balanceUpdatedAt: toIso(bal?.updatedAt),
  };
}

export interface ThanksMint {
  from: string;
  to: string;
  amountThx: string;
  message: string;
  at: string | null;
}

export type ThanksDirection = "sent" | "received" | "any";

/**
 * Recent `MintThanksToken` rows for a workspace, optionally narrowed to one
 * wallet and one direction.
 *
 * "any" direction is issued as two aliased selections rather than a `where.or`
 * clause: graph-node's `or` sits alongside the sibling filters and its
 * precedence against them is not something to guess at when the sibling is
 * the workspace scope. Two aliases in one request are unambiguous and still
 * a single round-trip.
 */
export async function resolveThanksHistory(
  env: Env,
  treeId: string,
  opts: {
    wallet?: Address;
    direction: ThanksDirection;
    sinceUnix?: number;
    limit: number;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<ThanksMint[]> {
  const fields = "from to amount data blockTimestamp";
  const base: Record<string, unknown> = { workspaceId: treeId };
  if (opts.sinceUnix !== undefined) {
    base.blockTimestamp_gte = String(opts.sinceUnix);
  }

  const owner = opts.wallet?.toLowerCase();
  const selections: string[] = [];
  const variables: Record<string, unknown> = { first: opts.limit };

  const add = (alias: string, where: Record<string, unknown>) => {
    variables[alias] = where;
    selections.push(
      `${alias}: mintThanksTokens(where: $${alias}, orderBy: blockTimestamp,` +
        ` orderDirection: desc, first: $first) { ${fields} }`,
    );
  };

  if (!owner) {
    add("all", base);
  } else {
    if (opts.direction !== "received") add("sent", { ...base, from: owner });
    if (opts.direction !== "sent") add("received", { ...base, to: owner });
  }

  const varDecls = Object.keys(variables)
    .filter((k) => k !== "first")
    .map((k) => `$${k}: MintThanksToken_filter!`)
    .join(", ");

  const data = await goldsky<
    Record<
      string,
      Array<{
        from: string;
        to: string;
        amount: string;
        data: string;
        blockTimestamp: string;
      }>
    >
  >(
    env,
    `query(${varDecls}, $first: Int!) { ${selections.join(" ")} }`,
    variables,
    fetchImpl,
    "subgraph thanks history lookup",
  );

  // Each alias is already sorted; merging two of them needs a re-sort, and
  // the limit applies to the merged list, not to each side.
  return Object.values(data)
    .flat()
    .map((m) => ({
      from: m.from,
      to: m.to,
      amountThx: formatEther(BigInt(m.amount)),
      message: decodeThanksMessage(m.data),
      at: toIso(m.blockTimestamp),
      _ts: Number(m.blockTimestamp),
    }))
    .sort((a, b) => b._ts - a._ts)
    .slice(0, opts.limit)
    .map((m) => ({
      from: m.from,
      to: m.to,
      amountThx: m.amountThx,
      message: m.message,
      at: m.at,
    }));
}

// ------------------------------------------------------------------ quests

export const QUEST_STATUSES = [
  "Open",
  "PendingReview",
  "Completed",
  "Cancelled",
] as const;
export type QuestStatus = (typeof QUEST_STATUSES)[number];

export interface QuestSummary {
  questId: string;
  title: string | null;
  description: string | null;
  status: QuestStatus;
  /** Role-share reward, raw share count (not 18-decimal). */
  amountShares: string;
  hatId: string;
  wearer: string;
  creator: string;
  submitter: string | null;
  approvalCount: number;
  attemptCount: number;
  createdAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

const QUEST_FIELDS =
  "questId hatId wearer creator submitter amount status approvalCount" +
  " attemptCount createdAt submittedAt completedAt cancelledAt" +
  " metadata { title description }";

interface RawQuest {
  questId: string;
  hatId: string;
  wearer: string;
  creator: string;
  submitter: string | null;
  amount: string;
  status: QuestStatus;
  approvalCount: number;
  attemptCount: number;
  createdAt: string;
  submittedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  metadata?: { title?: string | null; description?: string | null } | null;
}

function toSummary(q: RawQuest): QuestSummary {
  return {
    questId: q.questId,
    title: q.metadata?.title ?? null,
    description: q.metadata?.description ?? null,
    status: q.status,
    amountShares: q.amount,
    hatId: q.hatId,
    wearer: q.wearer,
    creator: q.creator,
    submitter: q.submitter ?? null,
    approvalCount: q.approvalCount,
    attemptCount: q.attemptCount,
    createdAt: toIso(q.createdAt),
    submittedAt: toIso(q.submittedAt),
    completedAt: toIso(q.completedAt),
    cancelledAt: toIso(q.cancelledAt),
  };
}

/**
 * Quests in a workspace, filtered by status.
 *
 * `Quest` has no `workspaceId` scalar — it is scoped through the `workspace`
 * relation, whose id *is* the treeId.
 */
export async function resolveQuests(
  env: Env,
  treeId: string,
  opts: { statuses?: readonly QuestStatus[]; limit: number },
  fetchImpl: typeof fetch = fetch,
): Promise<QuestSummary[]> {
  const where: Record<string, unknown> = { workspace: treeId };
  if (opts.statuses?.length) where.status_in = opts.statuses;

  const data = await goldsky<{ quests?: RawQuest[] }>(
    env,
    `query($where: Quest_filter!, $first: Int!) {
       quests(where: $where, orderBy: createdAt, orderDirection: desc,
              first: $first) { ${QUEST_FIELDS} } }`,
    { where, first: opts.limit },
    fetchImpl,
    "subgraph quests lookup",
  );
  return (data.quests ?? []).map(toSummary);
}

export interface QuestAttempt {
  attemptIndex: number;
  submitter: string;
  outcome: "Pending" | "Withdrawn" | "Rejected" | "Approved";
  submittedAt: string | null;
  withdrawnAt: string | null;
  rejectedAt: string | null;
  approvedAt: string | null;
  approvals: Array<{ approver: string; approvedAt: string | null }>;
}

export interface QuestDetail extends QuestSummary {
  metadataUri: string;
  questModule: string;
  attempts: QuestAttempt[];
}

/**
 * One quest with its full review trail.
 *
 * Looked up by `(workspace, questId)` rather than by entity id: the id is
 * `${questModule}-${questId}`, which would cost an extra query to resolve the
 * module address first.
 */
export async function resolveQuestDetail(
  env: Env,
  treeId: string,
  questId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<QuestDetail | null> {
  const data = await goldsky<{
    quests?: Array<
      RawQuest & {
        metadataUri: string;
        questModule: string;
        attempts: Array<{
          attemptIndex: number;
          submitter: string;
          outcome: QuestAttempt["outcome"];
          submittedAt: string;
          withdrawnAt: string | null;
          rejectedAt: string | null;
          approvedAt: string | null;
          approvals: Array<{ approver: string; approvedAt: string }>;
        }>;
      }
    >;
  }>(
    env,
    `query($where: Quest_filter!) { quests(where: $where, first: 1) {
       ${QUEST_FIELDS} metadataUri questModule
       attempts(orderBy: attemptIndex, orderDirection: asc, first: 100) {
         attemptIndex submitter outcome submittedAt withdrawnAt rejectedAt
         approvedAt approvals(first: 100) { approver approvedAt } } } }`,
    { where: { workspace: treeId, questId } },
    fetchImpl,
    "subgraph quest detail lookup",
  );
  const q = data.quests?.[0];
  if (!q) return null;
  return {
    ...toSummary(q),
    metadataUri: q.metadataUri,
    questModule: q.questModule,
    attempts: q.attempts.map((a) => ({
      attemptIndex: a.attemptIndex,
      submitter: a.submitter,
      outcome: a.outcome,
      submittedAt: toIso(a.submittedAt),
      withdrawnAt: toIso(a.withdrawnAt),
      rejectedAt: toIso(a.rejectedAt),
      approvedAt: toIso(a.approvedAt),
      approvals: a.approvals.map((ap) => ({
        approver: ap.approver,
        approvedAt: toIso(ap.approvedAt),
      })),
    })),
  };
}

// ----------------------------------------------------------------- members

export interface RoleShareHolder {
  /** Wallet holding the share. */
  owner: string;
  /** Role (hat) the share belongs to, decimal. */
  hatId: string;
  /** Wallet that wears the role — the share's "origin". */
  wearer: string;
  /** Raw share count (FractionToken supply is a fixed 10000 per role). */
  shares: string;
  updatedAt: string | null;
}

export interface WorkspaceRoles {
  holders: RoleShareHolder[];
  /** Shares minted for a role but not yet claimed by their wearer. */
  escrowed: Array<{
    hatId: string;
    wearer: string;
    shares: string;
    creator: string;
    updatedAt: string | null;
  }>;
}

/**
 * Who holds which role shares in this workspace.
 *
 * Only the Toban subgraph is read here — deliberately not the Hats subgraph.
 * `resolveRelatedRoles` in `chain.ts` merges both because a freshly-minted hat
 * may not be indexed here yet and `mintableAmount` must not under-count. This
 * is a listing, not a cap calculation, so a role that appears a block late is
 * acceptable and the second endpoint is not worth the latency.
 */
export async function resolveWorkspaceRoles(
  env: Env,
  treeId: string,
  limit: number,
  fetchImpl: typeof fetch = fetch,
): Promise<WorkspaceRoles> {
  const data = await goldsky<{
    balanceOfFractionTokens?: Array<{
      owner: string;
      hatId: string;
      wearer: string;
      balance: string;
      updatedAt: string;
    }>;
    escrowedRoleShares?: Array<{
      hatId: string;
      wearer: string;
      amount: string;
      creator: string;
      updatedAt: string;
    }>;
  }>(
    env,
    "query($ws: ID!, $wsStr: String!, $first: Int!) {" +
      ' balanceOfFractionTokens(where: {workspaceId: $ws, balance_gt: "0"},' +
      " orderBy: balance, orderDirection: desc, first: $first) {" +
      " owner hatId wearer balance updatedAt }" +
      ' escrowedRoleShares(where: {workspace: $wsStr, amount_gt: "0"},' +
      " orderBy: updatedAt, orderDirection: desc, first: $first) {" +
      " hatId wearer amount creator updatedAt } }",
    { ws: treeId, wsStr: treeId, first: limit },
    fetchImpl,
    "subgraph workspace roles lookup",
  );
  return {
    holders: (data.balanceOfFractionTokens ?? []).map((b) => ({
      owner: b.owner,
      hatId: b.hatId,
      wearer: b.wearer,
      shares: b.balance,
      updatedAt: toIso(b.updatedAt),
    })),
    escrowed: (data.escrowedRoleShares ?? []).map((e) => ({
      hatId: e.hatId,
      wearer: e.wearer,
      shares: e.amount,
      creator: e.creator,
      updatedAt: toIso(e.updatedAt),
    })),
  };
}

// ----------------------------------------------------- reward distributions

export const DISTRIBUTOR_STATUSES = [
  "Pending",
  "Executed",
  "Reclaimed",
] as const;
export type DistributorStatus = (typeof DISTRIBUTOR_STATUSES)[number];

export interface RewardDistribution {
  address: string;
  scheduler: string;
  status: DistributorStatus;
  scheduledDate: string | null;
  /** ERC-20 addresses this distributor pays out in. */
  tokens: string[];
  backupWallet: string;
  split: string | null;
  executedAt: string | null;
  reclaimedAt: string | null;
  createdAt: string | null;
  /**
   * Per-token totals. Raw base units — the subgraph does not index ERC-20
   * decimals, so these are NOT comparable to the `*Thx` fields elsewhere.
   */
  balances: Array<{
    token: string;
    totalDepositedRaw: string;
    executedAmountRaw: string | null;
    reclaimedAmountRaw: string | null;
  }>;
}

/** Scheduled reward distributions for a workspace, newest first. */
export async function resolveRewardDistributions(
  env: Env,
  treeId: string,
  opts: { statuses?: readonly DistributorStatus[]; limit: number },
  fetchImpl: typeof fetch = fetch,
): Promise<RewardDistribution[]> {
  const where: Record<string, unknown> = { workspaceId: treeId };
  if (opts.statuses?.length) where.status_in = opts.statuses;

  const data = await goldsky<{
    scheduledDistributors?: Array<{
      id: string;
      scheduler: string;
      tokens: string[];
      backupWallet: string;
      scheduledDate: string;
      status: DistributorStatus;
      split: string | null;
      executedAt: string | null;
      reclaimedAt: string | null;
      createdAt: string;
      tokenBalances: Array<{
        token: string;
        totalDeposited: string;
        executedAmount: string | null;
        reclaimedAmount: string | null;
      }>;
    }>;
  }>(
    env,
    "query($where: ScheduledDistributor_filter!, $first: Int!) {" +
      " scheduledDistributors(where: $where, orderBy: scheduledDate," +
      " orderDirection: desc, first: $first) {" +
      " id scheduler tokens backupWallet scheduledDate status split" +
      " executedAt reclaimedAt createdAt" +
      " tokenBalances(first: 50) { token totalDeposited executedAmount" +
      " reclaimedAmount } } }",
    { where, first: opts.limit },
    fetchImpl,
    "subgraph reward distributions lookup",
  );
  return (data.scheduledDistributors ?? []).map((d) => ({
    address: d.id,
    scheduler: d.scheduler,
    status: d.status,
    scheduledDate: toIso(d.scheduledDate),
    tokens: d.tokens,
    backupWallet: d.backupWallet,
    split: d.split,
    executedAt: toIso(d.executedAt),
    reclaimedAt: toIso(d.reclaimedAt),
    createdAt: toIso(d.createdAt),
    balances: d.tokenBalances.map((b) => ({
      token: b.token,
      totalDepositedRaw: b.totalDeposited,
      executedAmountRaw: b.executedAmount,
      reclaimedAmountRaw: b.reclaimedAmount,
    })),
  }));
}
