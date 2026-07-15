import type { ApolloClient } from "@apollo/client/core";
import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import {
  type GetThanksTokenBalancesQuery,
  type GetThanksTokenBalancesQueryVariables,
  type GetThanksTokenMintsQuery,
  type GetThanksTokenMintsQueryVariables,
  type GetThanksTokenTransfersQuery,
  type GetThanksTokenTransfersQueryVariables,
  type MintThanksToken_Filter,
  MintThanksToken_OrderBy,
  type OrderDirection,
  type TransferThanksToken_Filter,
  TransferThanksToken_OrderBy,
} from "gql/graphql";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address } from "viem";
import { formatEther } from "viem";
import { thanksTokenBaseConfig } from "./useContracts";
import { useGetBalanceOfFractionTokens } from "./useFractionToken";
import { useTreeInfo } from "./useHats";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";
import { useGetWorkspace } from "./useWorkspace";

/** Matches `$treeId._index` — keep poll refetches aligned with the home feed. */
export const HOME_ACTIVITY_MINTS_LIMIT = 20;

const ACTIVITY_MINTS_POLL_INTERVAL_MS = 3000;
const ACTIVITY_MINTS_POLL_MAX_MS = 30_000;

const activityMintsQueryVariables = (
  workspaceId: string,
  limit = HOME_ACTIVITY_MINTS_LIMIT,
): GetThanksTokenMintsQueryVariables => ({
  where: { workspaceId },
  orderBy: MintThanksToken_OrderBy.BlockTimestamp,
  orderDirection: "desc" as OrderDirection,
  first: limit,
});

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export type ActivityMintPollCriteria = {
  workspaceId: string;
  fromAddress: string;
  blockNumber: bigint;
  /** Lowercase or checksummed — one entry per recipient (batch mint). */
  toAddresses: string[];
};

const mintMatchesSend = (
  mint: { from: string; to: string; blockNumber: unknown },
  criteria: ActivityMintPollCriteria,
): boolean => {
  if (mint.from.toLowerCase() !== criteria.fromAddress.toLowerCase()) {
    return false;
  }
  if (BigInt(String(mint.blockNumber)) !== criteria.blockNumber) {
    return false;
  }
  return criteria.toAddresses.some(
    (to) => to.toLowerCase() === mint.to.toLowerCase(),
  );
};

const allRecipientsIndexed = (
  mints: Array<{ from: string; to: string; blockNumber: unknown }>,
  criteria: ActivityMintPollCriteria,
): boolean => {
  const indexedTos = new Set(
    mints
      .filter((m) => mintMatchesSend(m, criteria))
      .map((m) => m.to.toLowerCase()),
  );
  return criteria.toAddresses.every((to) => indexedTos.has(to.toLowerCase()));
};

/**
 * After a successful thanks mint, refetch workspace mints immediately then poll
 * every 3s (max 30s) until the subgraph indexes this send. Updates Apollo
 * cache for `useThanksTokenActivity` / home "最近のアクティビティ".
 */
export async function pollActivityMintsAfterSend(
  client: ApolloClient<object>,
  criteria: ActivityMintPollCriteria,
): Promise<void> {
  const variables = activityMintsQueryVariables(criteria.workspaceId);

  const fetchMints = () =>
    client.query<GetThanksTokenMintsQuery, GetThanksTokenMintsQueryVariables>({
      query: queryGetThanksTokenMints,
      variables,
      fetchPolicy: "network-only",
    });

  const deadline = Date.now() + ACTIVITY_MINTS_POLL_MAX_MS;

  while (Date.now() <= deadline) {
    const { data } = await fetchMints();
    const mints = data?.mintThanksTokens ?? [];
    if (allRecipientsIndexed(mints, criteria)) {
      return;
    }
    if (Date.now() + ACTIVITY_MINTS_POLL_INTERVAL_MS > deadline) {
      return;
    }
    await sleep(ACTIVITY_MINTS_POLL_INTERVAL_MS);
  }
}

// GraphQL queries for ThanksToken data from Goldsky
const queryGetThanksTokenBalances = gql(`
  query GetThanksTokenBalances($where: BalanceOfThanksToken_filter = {}, $orderBy: BalanceOfThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 100) {
    balanceOfThanksTokens(
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
    ) {
      id
      thanksToken {
        id
        workspaceId
      }
      owner
      balance
      workspaceId
      updatedAt
    }
  }
`);

const queryGetThanksTokenMints = gql(`
  query GetThanksTokenMints($where: MintThanksToken_filter = {}, $orderBy: MintThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {
    mintThanksTokens(
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
    ) {
      id
      thanksToken {
        id
        workspaceId
      }
      from
      to
      data
      amount
      workspaceId
      blockTimestamp
      blockNumber
    }
  }
`);

const queryGetThanksTokenTransfers = gql(`
  query GetThanksTokenTransfers($where: TransferThanksToken_filter = {}, $orderBy: TransferThanksToken_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {
    transferThanksTokens(
      where: $where
      orderBy: $orderBy
      orderDirection: $orderDirection
      first: $first
    ) {
      id
      thanksToken {
        id
        workspaceId
      }
      from
      to
      amount
      workspaceId
      blockTimestamp
      blockNumber
    }
  }
`);

const queryGetThanksTokens = gql(`
  query GetThanksTokens($where: ThanksToken_filter, $first: Int = 100) {
    thanksTokens(
      where: $where
      first: $first
    ) {
      workspaceId
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
    GetThanksTokenTransfersQuery,
    GetThanksTokenTransfersQueryVariables
  >(queryGetThanksTokenTransfers, {
    variables: {
      where: params.where,
      orderBy: params.orderBy,
      orderDirection: params.orderDirection,
      first: params.first,
    },
  });

  const convertAmountInResponse = (
    data: GetThanksTokenTransfersQuery | undefined,
  ) => {
    if (data === undefined || data.transferThanksTokens === undefined) {
      return data;
    }
    return {
      ...data,
      transferThanksTokens: data.transferThanksTokens.map((token) => ({
        ...token,
        amount: formatEther(token.amount),
      })),
    };
  };

  return {
    ...result,
    data: convertAmountInResponse(result.data),
  };
};

export const useGetBalanceOfThanksTokens = (
  params: GetThanksTokenBalancesQueryVariables,
) => {
  const result = useQuery<
    GetThanksTokenBalancesQuery,
    GetThanksTokenBalancesQueryVariables
  >(queryGetThanksTokenBalances, {
    variables: params,
  });

  return result;
};

export const useGetMintThanksTokens = (params: {
  where?: MintThanksToken_Filter;
  orderBy?: MintThanksToken_OrderBy;
  orderDirection?: OrderDirection;
  first?: number;
}) => {
  const result = useQuery<
    GetThanksTokenMintsQuery,
    GetThanksTokenMintsQueryVariables
  >(queryGetThanksTokenMints, {
    variables: {
      where: params.where,
      orderBy: params.orderBy,
      orderDirection: params.orderDirection,
      first: params.first,
    },
  });

  const convertAmountInResponse = useMemo(() => {
    if (
      result.data === undefined ||
      result.data.mintThanksTokens === undefined
    ) {
      return result.data;
    }

    return {
      ...result.data,
      mintThanksTokens: result.data.mintThanksTokens.map((token) => ({
        ...token,
        amount: formatEther(token.amount),
      })),
    };
  }, [result.data]);

  return {
    ...result,
    data: convertAmountInResponse,
  };
};

export const useThanksToken = (treeId: string) => {
  const { data } = useGetWorkspace({ workspaceId: treeId });
  const treeInfo = useTreeInfo(Number(treeId));
  const { wallet } = useActiveWallet();
  const [mintableAmount, setMintableAmount] = useState<bigint>();

  const walletAddress = wallet?.account.address?.toLowerCase();
  const myRoles = useMemo(() => {
    const roles = treeInfo?.hats || [];
    return (
      roles.filter((hat) => hat.wearers?.some((w) => w.id === walletAddress)) ||
      []
    );
  }, [treeInfo, walletAddress]);

  const { data: balanceOfFractionTokens } = useGetBalanceOfFractionTokens({
    where: {
      workspaceId: treeId,
      owner: wallet?.account.address.toLowerCase(),
    },
    first: 100,
  });

  const relatedRoles = useMemo(() => {
    return [
      ...(balanceOfFractionTokens?.balanceOfFractionTokens.map((d) => {
        return {
          hatId: d.hatId,
          wearer: d.wearer as `0x${string}`,
        };
      }) || []),
      ...(myRoles.map((mr) => {
        return {
          hatId: BigInt(mr.id),
          wearer: walletAddress as `0x${string}`,
        };
      }) || []),
    ];
  }, [balanceOfFractionTokens, myRoles, walletAddress]);

  useEffect(() => {
    const fetchMintableAmount = async () => {
      if (
        !relatedRoles.length ||
        !data?.workspace?.thanksToken.id ||
        !walletAddress
      )
        return;

      const amount = await publicClient.readContract({
        ...thanksTokenBaseConfig(
          data?.workspace?.thanksToken.id as `0x${string}`,
        ),
        functionName: "mintableAmount",
        args: [walletAddress as `0x${string}`, relatedRoles],
      });
      setMintableAmount(amount);
    };

    fetchMintableAmount();
  }, [relatedRoles, data?.workspace?.thanksToken.id, walletAddress]);

  const [isLoading, setIsLoading] = useState(false);
  const mintThanksToken = useCallback(
    async (to: Address, amount: bigint, extraData: `0x${string}` = "0x") => {
      if (!wallet || !relatedRoles.length) return;
      setIsLoading(true);

      let txHash: `0x${string}` | undefined = undefined;
      let blockNumber: bigint | undefined = undefined;
      let error = "";

      try {
        txHash = await wallet.writeContract({
          ...thanksTokenBaseConfig(
            data?.workspace?.thanksToken.id as `0x${string}`,
          ),
          functionName: "mint",
          args: [to, amount, relatedRoles, extraData],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        blockNumber = receipt.blockNumber;
        setIsLoading(false);
      } catch (_) {
        error = "トークンの送信に失敗しました";
        setIsLoading(false);
      }

      return { txHash, blockNumber, error };
    },
    [relatedRoles, wallet, data?.workspace?.thanksToken.id],
  );

  const batchMintThanksToken = useCallback(
    async (
      tos: Address[],
      amount: bigint[],
      extraData: `0x${string}` = "0x",
    ) => {
      if (!wallet || !relatedRoles.length) return;
      setIsLoading(true);

      let txHash: `0x${string}` | undefined = undefined;
      let blockNumber: bigint | undefined = undefined;
      let error = "";

      try {
        txHash = await wallet.writeContract({
          ...thanksTokenBaseConfig(
            data?.workspace?.thanksToken.id as `0x${string}`,
          ),
          functionName: "batchMint",
          args: [tos, amount, relatedRoles, extraData],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        blockNumber = receipt.blockNumber;
        setIsLoading(false);
      } catch (_) {
        error = "トークンの送信に失敗しました";
        setIsLoading(false);
      }

      return { txHash, blockNumber, error };
    },
    [relatedRoles, wallet, data?.workspace?.thanksToken.id],
  );

  return { mintableAmount, mintThanksToken, batchMintThanksToken, isLoading };
};

export const useUserThanksTokenBalance = (workspaceId?: string) => {
  const { wallet } = useActiveWallet();

  const { data } = useQuery<
    GetThanksTokenBalancesQuery,
    GetThanksTokenBalancesQueryVariables
  >(queryGetThanksTokenBalances, {
    variables: {
      where: {
        workspaceId,
        owner: wallet?.account?.address?.toLowerCase(),
      },
      first: 1,
    },
    skip: !workspaceId || !wallet?.account?.address,
  });

  const balance = data?.balanceOfThanksTokens?.[0]?.balance || "0";
  return {
    balance: Number(balance),
    data: data?.balanceOfThanksTokens?.[0],
  };
};

export const useThanksTokenActivity = (workspaceId?: string, limit = 10) => {
  const { data: transfersData, loading: transfersLoading } = useQuery<
    GetThanksTokenTransfersQuery,
    GetThanksTokenTransfersQueryVariables
  >(queryGetThanksTokenTransfers, {
    variables: {
      where: { workspaceId },
      orderBy: TransferThanksToken_OrderBy.BlockTimestamp,
      orderDirection: "desc" as OrderDirection,
      first: limit,
    },
    skip: !workspaceId,
  });

  const { data: mintsData, loading: mintsLoading } = useQuery<
    GetThanksTokenMintsQuery,
    GetThanksTokenMintsQueryVariables
  >(queryGetThanksTokenMints, {
    variables: workspaceId
      ? activityMintsQueryVariables(workspaceId, limit)
      : undefined,
    skip: !workspaceId,
  });

  const activities = useMemo(() => {
    const transfers =
      transfersData?.transferThanksTokens?.map((t) => ({
        ...t,
        type: "transfer" as const,
        thanksToken: { symbol: "THX" },
      })) || [];

    const mints =
      mintsData?.mintThanksTokens?.map((m) => ({
        ...m,
        type: "mint" as const,
        thanksToken: { symbol: "THX" },
      })) || [];

    return [...transfers, ...mints]
      .sort((a, b) => Number(b.blockTimestamp) - Number(a.blockTimestamp))
      .slice(0, limit);
  }, [transfersData, mintsData, limit]);

  return {
    activities,
    transfers: transfersData,
    mints: mintsData,
    isLoading: transfersLoading || mintsLoading,
  };
};

export const useGetHoldingThanksTokens = (
  owner?: Address,
  variables?: GetThanksTokenBalancesQueryVariables,
) => {
  const { data } = useQuery<
    GetThanksTokenBalancesQuery,
    GetThanksTokenBalancesQueryVariables
  >(queryGetThanksTokenBalances, {
    variables: {
      ...variables,
      where: { ...variables?.where, owner: owner?.toLowerCase() },
    },
    skip: !owner,
  });

  return data?.balanceOfThanksTokens || [];
};
