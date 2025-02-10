import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type {
  GetWorkspaceQuery,
  GetWorkspaceQueryVariables,
  HatsHatCreatorModuleAuthority_Filter,
  HatsTimeFrameModuleAuthority_Filter,
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
  query GetWorkspace($workspaceId: ID!, $hatsHatCreatorModuleAuthority_filter: HatsHatCreatorModuleAuthority_filter, $hatsTimeFrameModuleAuthority_filter: HatsTimeFrameModuleAuthority_filter) {
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
        authorities(where: $hatsHatCreatorModuleAuthority_filter) {
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
        authorities(where: $hatsTimeFrameModuleAuthority_filter) {
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

export const useGetWorkspace = (
  workspaceId?: string,
  hatsHatCreatorModuleAuthority_filter?: HatsHatCreatorModuleAuthority_Filter,
  hatsTimeFrameModuleAuthority_filter?: HatsTimeFrameModuleAuthority_Filter,
) => {
  const result = useQuery<GetWorkspaceQuery, GetWorkspaceQueryVariables>(
    queryGetWorkspace,
    {
      variables: {
        workspaceId: workspaceId ?? "",
        hatsHatCreatorModuleAuthority_filter,
        hatsTimeFrameModuleAuthority_filter,
      },
    },
  );

  return result;
};
