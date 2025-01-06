import { useQuery } from "@apollo/client/react/hooks";
import { gql } from "@apollo/client/core";
import { GetWorkspaceQuery, GetWorkspaceQueryVariables } from "gql/graphql";

const queryGetWorkspaces = gql(`
  query GetWorkspaces($where: Workspace_filter) {
    workspaces(where: $where) {
      topHatId
      splitCreator
      id
      hatterHatId
      hatsTimeFrameModule
      creator
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
    }
  );

  return result;
};
