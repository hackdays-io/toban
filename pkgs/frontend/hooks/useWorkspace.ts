import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type {
  GetWorkspaceQuery,
  GetWorkspaceQueryVariables,
  GetWorkspacesQuery,
  GetWorkspacesQueryVariables,
} from "gql/graphql";

const queryGetWorkspace = gql(`
  query GetWorkspace($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      minterHatId
      operatorHatId
      owner
      splitCreator
      topHatId
      hatterHatId
      hatsTimeFrameModule
      hatsHatCreatorModule
      creator
      creatorHatId
      blockTimestamp
      blockNumber
      hatsFractionTokenModule {
        id
      }
      thanksToken {
        id
      }
    }
  }
`);

const queryGetWorkspaces = gql(`
  query GetWorkspaces($where: Workspace_filter, $first: Int = 100) {
    workspaces(where: $where, first: $first) {
      id
      minterHatId
      operatorHatId
      owner
      splitCreator
      topHatId
      hatterHatId
      hatsTimeFrameModule
      hatsHatCreatorModule
      creator
      creatorHatId
      blockTimestamp
      blockNumber
      hatsFractionTokenModule {
        id
      }
      thanksToken {
        id
      }
    }
  }
`);

export const useGetWorkspace = (variables?: GetWorkspaceQueryVariables) => {
  const result = useQuery<GetWorkspaceQuery, GetWorkspaceQueryVariables>(
    queryGetWorkspace,
    { variables },
  );

  return result;
};

export const useGetWorkspaces = (variables?: GetWorkspacesQueryVariables) => {
  const result = useQuery<GetWorkspacesQuery, GetWorkspacesQueryVariables>(
    queryGetWorkspaces,
    { variables },
  );

  return result;
};
