import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";

// Quest entities are defined in `pkgs/subgraph/schema.graphql` (HatsQuestModule
// integration, issue #468). The deployed Goldsky endpoints haven't been
// redeployed yet, so this query is written without codegen typings and uses
// `errorPolicy: "ignore"` so the rest of the page renders cleanly when the
// schema field is absent. Once the subgraph is redeployed the same query
// shape returns data — no callsite changes required.

export type QuestStatus = "Open" | "PendingReview" | "Completed" | "Cancelled";

export interface Quest {
  id: string;
  questId: string;
  hatId: string;
  wearer: string;
  creator: string;
  submitter: string | null;
  amount: string;
  status: QuestStatus;
  metadataHash: string;
  approvalCount: number;
  attemptCount: number;
  createdAt: string;
  blockTimestamp: string;
}

interface GetQuestsResult {
  quests: Quest[];
}

const queryGetQuests = gql(`
  query GetQuestsForWorkspace($workspaceId: String!, $first: Int = 10, $statuses: [String!]) {
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

export const useQuests = (
  workspaceId?: string,
  options?: { statuses?: QuestStatus[]; first?: number },
) => {
  const { data, loading, error } = useQuery<GetQuestsResult>(queryGetQuests, {
    variables: {
      workspaceId: workspaceId ?? "",
      first: options?.first ?? 10,
      statuses: options?.statuses,
    },
    skip: !workspaceId,
    // The Quest schema may not exist on every deployed subgraph yet — silence
    // the error so the surrounding UI can render a graceful empty state.
    errorPolicy: "ignore",
  });

  return {
    quests: data?.quests ?? [],
    isLoading: loading,
    error,
  };
};
