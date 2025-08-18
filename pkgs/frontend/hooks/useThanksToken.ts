import type {
  GetTransferThanksTokensQuery,
  OrderDirection,
  TransferFractionToken_Filter,
  TransferFractionToken_OrderBy,
} from "gql/graphql";

type TokenItemType = {
  data: GetTransferThanksTokensQuery;
};

export const useGetTransferThanksTokens = (params: {
  where?: TransferFractionToken_Filter;
  orderBy?: TransferFractionToken_OrderBy;
  orderDirection?: OrderDirection;
  first?: number;
}): TokenItemType => {
  /* create mock result */
  const result: TokenItemType = {
    data: {
      transferThanksTokens: [
        {
          amount: 1,
          from: "0x123",
          to: "0x456",
          tokenId: 1,
          blockNumber: 1,
          blockTimestamp: new Date(),
          hatId: null,
          id: "1",
          wearer: null,
          workspaceId: null,
        },
      ],
    },
  };
  return result;
};
