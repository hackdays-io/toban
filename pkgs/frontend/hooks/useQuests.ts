import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type {
  GetQuestDetailQuery,
  GetQuestDetailQueryVariables,
  GetQuestsForWorkspaceQuery,
  GetQuestsForWorkspaceQueryVariables,
  QuestStatus as QuestStatusGql,
} from "gql/graphql";

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

export const useQuests = (
  workspaceId?: string,
  options?: { statuses?: QuestStatus[]; first?: number },
) => {
  const { data, loading, error } = useQuery<
    GetQuestsForWorkspaceQuery,
    GetQuestsForWorkspaceQueryVariables
  >(queryGetQuests, {
    variables: {
      workspaceId: workspaceId ?? "",
      first: options?.first ?? 10,
      statuses: options?.statuses as QuestStatusGql[] | undefined,
    },
    skip: !workspaceId,
  });

  return {
    quests: data?.quests ?? [],
    isLoading: loading,
    error,
  };
};

// Fetches a single quest by its subgraph id (`${questModule}-${questId}`),
// including the most recent submission attempt and its approvals so the
// detail page can render the n/2 progress and approver list.
export const useQuest = (id?: string) => {
  const { data, loading, error, refetch } = useQuery<
    GetQuestDetailQuery,
    GetQuestDetailQueryVariables
  >(queryGetQuestDetail, {
    variables: { id: id ?? "" },
    skip: !id,
  });

  return {
    quest: data?.quest ?? undefined,
    isLoading: loading,
    error,
    refetch,
  };
};
