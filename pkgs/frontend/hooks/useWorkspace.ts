import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type {
  GetWorkspaceQuery,
  GetWorkspaceQueryVariables,
} from "gql/graphql";

const queryGetWorkspaces = gql(`
  query GetWorkspaces($where: Workspace_filter) {
    workspaces(where: $where) {
      creator
      topHatId
      splitCreator
      id
      hatterHatId
      hatsTimeFrameModule
      blockTimestamp
      blockNumber
    }
  }
`);

const queryGetWorkspace = gql(`
  query GetWorkspace($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      creator
      hatsTimeFrameModule
      hatterHatId
      id
      splitCreator
      topHatId
      blockTimestamp
      blockNumber
    }
  }
`);

export const useGetWorkspace = (workspaceId?: string) => {
  const result = useQuery<GetWorkspaceQuery, GetWorkspaceQueryVariables>(
    queryGetWorkspace,
    {
      variables: {
        workspaceId: workspaceId!,
      },
    },
  );

  return result;
};
