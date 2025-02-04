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
      hatsTimeFrameModule {
        id
      }
      hatsHatCreatorModule {
        id
      }
      blockTimestamp
      blockNumber
    }
  }
`);

const queryGetWorkspace = gql(`
  query GetWorkspace($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      blockNumber
      blockTimestamp
      creator
      hatterHatId
      id
      splitCreator
      topHatId
      hatsHatCreatorModule {
        id
        authorities(where: { authorised: true }) {
          address
          authorised
          blockNumber
          blockTimestamp
          id
          workspaceId
        }
      }
      hatsTimeFrameModule {
        id
        authorities(where: { authorised: true }) {
          address
          authorised
          blockNumber
          blockTimestamp
          id
          workspaceId
        }
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
