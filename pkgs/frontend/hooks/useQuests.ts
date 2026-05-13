import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type {
  GetQuestDetailQuery,
  GetQuestDetailQueryVariables,
  GetQuestsForWorkspaceQuery,
  GetQuestsForWorkspaceQueryVariables,
  QuestStatus as QuestStatusGql,
} from "gql/graphql";
import { useEffect } from "react";

// Keep the public type a string-literal union so existing callers can write
// plain "Open" / "PendingReview" strings. We coerce to the codegen enum at
// the gql variable boundary.
export type QuestStatus = `${QuestStatusGql}`;

export type Quest = NonNullable<GetQuestsForWorkspaceQuery["quests"]>[number];
export type QuestDetail = NonNullable<GetQuestDetailQuery["quest"]>;
export type QuestApprovalEntry = NonNullable<
  QuestDetail["attempts"]
>[number]["approvals"][number];

const queryGetQuests = gql(`
  query GetQuestsForWorkspace($workspaceId: String!, $first: Int = 10, $statuses: [QuestStatus!]) {
    quests(
      where: { workspace: $workspaceId, status_in: $statuses }
      orderBy: createdAt
      orderDirection: desc
      first: $first
    ) {
      id
      questId
      hatId
      wearer
      creator
      submitter
      amount
      status
      metadataHash
      approvalCount
      attemptCount
      createdAt
      blockTimestamp
    }
  }
`);

const queryGetQuestDetail = gql(`
  query GetQuestDetail($id: ID!) {
    quest(id: $id) {
      id
      questId
      hatId
      wearer
      creator
      submitter
      amount
      status
      metadataHash
      approvalCount
      attemptCount
      createdAt
      submittedAt
      completedAt
      cancelledAt
      questModule
      attempts(orderBy: attemptIndex, orderDirection: desc, first: 1) {
        id
        attemptIndex
        submitter
        submittedAt
        outcome
        approvals(orderBy: approvedAt, orderDirection: asc) {
          id
          approver
          approvedAt
        }
      }
    }
  }
`);

// Goldsky / The Graph rejects `status_in: null` with
//   "Non-list value passed to `_in` filter"
// so when callers don't narrow by status we still have to pass every status
// explicitly. Keep this list in sync with the `QuestStatus` enum in
// `schema.graphql`.
const ALL_QUEST_STATUSES: QuestStatusGql[] = [
  "Open",
  "PendingReview",
  "Completed",
  "Cancelled",
] as QuestStatusGql[];

export const useQuests = (
  workspaceId?: string,
  options?: { statuses?: QuestStatus[]; first?: number },
) => {
  const { data, loading, error, refetch } = useQuery<
    GetQuestsForWorkspaceQuery,
    GetQuestsForWorkspaceQueryVariables
  >(queryGetQuests, {
    variables: {
      workspaceId: workspaceId ?? "",
      first: options?.first ?? 10,
      statuses:
        (options?.statuses as QuestStatusGql[] | undefined) ??
        ALL_QUEST_STATUSES,
    },
    skip: !workspaceId,
    // Subgraph entities created in the last few seconds may not appear in the
    // cached response yet. Show cached data first, then revalidate against the
    // network on each render so newly-indexed quests show up without a manual
    // refresh.
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-and-network",
  });

  return {
    quests: data?.quests ?? [],
    isLoading: loading,
    error,
    refetch,
  };
};

// Fetches a single quest by its subgraph id (`${questModule}-${questId}`),
// including the most recent submission attempt and its approvals so the
// detail page can render the n/2 progress and approver list.
export const useQuest = (id?: string) => {
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery<
    GetQuestDetailQuery,
    GetQuestDetailQueryVariables
  >(queryGetQuestDetail, {
    variables: { id: id ?? "" },
    skip: !id,
    // Newly-created quests reach the detail page before the subgraph has
    // indexed the `QuestCreated` event. cache-and-network ensures we don't
    // serve a cached `null` indefinitely; pair this with the polling below
    // so the page self-heals within seconds of the indexer catching up.
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  // Poll briefly while the entity is missing so the detail page transitions
  // from "not found" to the real data without a manual refresh. Stop once
  // the quest shows up.
  const pendingQuest = !data?.quest;
  useEffect(() => {
    if (!id) return;
    if (pendingQuest) {
      startPolling(2000);
      return () => stopPolling();
    }
    stopPolling();
  }, [id, pendingQuest, startPolling, stopPolling]);

  return {
    quest: data?.quest ?? undefined,
    isLoading: loading,
    error,
    refetch,
  };
};
