import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type {
  GetTransferThanksTokensQuery,
  GetTransferThanksTokensQueryVariables,
  OrderDirection,
  TransferThanksToken_Filter,
  TransferThanksToken_OrderBy,
} from "gql/graphql";

const queryGetTransferThanksTokens = gql(`
  query GetTransferThanksTokens($where: TransferThanksToken_filter = {},
    $orderBy: TransferThanksToken_orderBy,
    $orderDirection: OrderDirection = asc,
    $first: Int = 10) {
    transferThanksTokens(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {
      id
      to
      from
      workspaceId
      blockTimestamp
      thanksToken {
        id
      }
      amount
    }
  }
`);

export const useGetTransferThanksTokens = (params: {
  where?: TransferThanksToken_Filter;
  orderBy?: TransferThanksToken_OrderBy;
  orderDirection?: OrderDirection;
  first?: number;
}) => {
  const result = useQuery<
    GetTransferThanksTokensQuery,
    GetTransferThanksTokensQueryVariables
  >(queryGetTransferThanksTokens, {
    variables: {
      where: params.where,
      orderBy: params.orderBy,
      orderDirection: params.orderDirection,
      first: params.first,
    },
  });

  return result;
};
