import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type {
  GetWorkspaceQuery,
  GetWorkspaceQueryVariables,
} from "gql/graphql";

const queryGetWorkspaces = gql(`
  query GetWorkspaces($where: Workspace_filter) {
    workspaces(where: $where) {
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

export const useGetWorkspace = (workspaceId?: string) => {
  const result = useQuery<GetWorkspaceQuery, GetWorkspaceQueryVariables>(
    queryGetWorkspace,
    {
      variables: {
        workspaceId: workspaceId ?? "",
      },
    },
  );

  return result;
};
