import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type { OrderDirection } from "gql/graphql";
import { useCallback, useState } from "react";
import type { Address } from "viem";
import { useActiveWallet } from "./useWallet";

// GraphQL queries for ThanksToken

const queryGetThanksTokenBalances = gql(`
  query GetThanksTokenBalances($where: ThanksTokenBalance_filter = {}, $orderBy: ThanksTokenBalance_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 100) {
    thanksTokenBalances(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {
      id
      thanksToken {
        id
        address
        name
        symbol
        workspaceId
      }
      owner
      balance
      workspaceId
      updatedAt
    }
  }
`);

const queryGetThanksTokenTransfers = gql(`
  query GetThanksTokenTransfers($where: ThanksTokenTransfer_filter = {}, $orderBy: ThanksTokenTransfer_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {
    thanksTokenTransfers(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {
      id
      thanksToken {
        id
        address
        name
        symbol
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

const queryGetThanksTokenMints = gql(`
  query GetThanksTokenMints($where: ThanksTokenMint_filter = {}, $orderBy: ThanksTokenMint_orderBy, $orderDirection: OrderDirection = asc, $first: Int = 10) {
    thanksTokenMints(where: $where, orderBy: $orderBy, orderDirection: $orderDirection, first: $first) {
      id
      thanksToken {
        id
        address
        name
        symbol
        workspaceId
      }
      to
      amount
      workspaceId
      blockTimestamp
      blockNumber
    }
  }
`);

const queryGetThanksTokenByWorkspace = gql(`
  query GetThanksTokenByWorkspace($workspaceId: ID!) {
    workspace(id: $workspaceId) {
      id
      thanksToken {
        id
        address
        name
        symbol
        totalSupply
        workspaceId
      }
    }
  }
`);

// Custom hooks

export const useThanksTokenBalances = (params: {
  where?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: OrderDirection;
  first?: number;
}) => {
  const result = useQuery(queryGetThanksTokenBalances, {
    variables: {
      where: params.where,
      orderBy: params.orderBy,
      orderDirection: params.orderDirection,
      first: params.first,
    },
  });

  return result;
};

export const useThanksTokenTransfers = (params: {
  where?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: OrderDirection;
  first?: number;
}) => {
  const result = useQuery(queryGetThanksTokenTransfers, {
    variables: {
      where: params.where,
      orderBy: params.orderBy,
      orderDirection: params.orderDirection,
      first: params.first,
    },
  });

  return result;
};

export const useThanksTokenMints = (params: {
  where?: Record<string, unknown>;
  orderBy?: string;
  orderDirection?: OrderDirection;
  first?: number;
}) => {
  const result = useQuery(queryGetThanksTokenMints, {
    variables: {
      where: params.where,
      orderBy: params.orderBy,
      orderDirection: params.orderDirection,
      first: params.first,
    },
  });

  return result;
};

export const useThanksTokenByWorkspace = (workspaceId?: string) => {
  const result = useQuery(queryGetThanksTokenByWorkspace, {
    variables: { workspaceId: workspaceId || "" },
    skip: !workspaceId,
  });

  return result;
};

// Hook to get user's ThanksToken balance for a specific workspace
export const useUserThanksTokenBalance = (workspaceId?: string) => {
  const { wallet } = useActiveWallet();

  const { data } = useThanksTokenBalances({
    where: {
      workspaceId,
      owner: wallet?.account?.address?.toLowerCase(),
    },
    first: 1,
  });

  const balance = data?.thanksTokenBalances?.[0]?.balance || "0";
  return {
    balance: Number(balance),
    data: data?.thanksTokenBalances?.[0],
  };
};

// Hook for ThanksToken activity (both transfers and mints)
export const useThanksTokenActivity = (workspaceId?: string, limit = 10) => {
  const { data: transfers } = useThanksTokenTransfers({
    where: { workspaceId },
    orderBy: "blockTimestamp",
    orderDirection: "desc" as OrderDirection,
    first: Math.ceil(limit / 2),
  });

  const { data: mints } = useThanksTokenMints({
    where: { workspaceId },
    orderBy: "blockTimestamp",
    orderDirection: "desc" as OrderDirection,
    first: Math.ceil(limit / 2),
  });

  // Combine and sort activities by timestamp
  const activities = [
    ...(transfers?.thanksTokenTransfers?.map((t: unknown) => ({
      ...(t as Record<string, unknown>),
      type: "transfer" as const,
    })) || []),
    ...(mints?.thanksTokenMints?.map((m: unknown) => ({
      ...(m as Record<string, unknown>),
      type: "mint" as const,
    })) || []),
  ]
    .sort((a: unknown, b: unknown) => {
      const aActivity = a as { blockTimestamp: string };
      const bActivity = b as { blockTimestamp: string };
      return (
        Number(bActivity.blockTimestamp) - Number(aActivity.blockTimestamp)
      );
    })
    .slice(0, limit);

  return { activities, isLoading: false };
};

// Contract interaction hooks (placeholder for future implementation)
export const useThanksToken = () => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);

  const mintThanksToken = useCallback(
    async (params: {
      to: Address;
      amount: bigint;
      relatedRoles: { hatId: bigint; wearer: Address }[];
    }) => {
      if (!wallet) return;

      setIsLoading(true);
      try {
        // TODO: Implement ThanksToken minting
        console.log("Minting ThanksToken:", params);
        // This will be implemented when ThanksToken contract integration is added
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  const transferThanksToken = useCallback(
    async (params: {
      to: Address;
      amount: bigint;
    }) => {
      if (!wallet) return;

      setIsLoading(true);
      try {
        // TODO: Implement ThanksToken transfer
        console.log("Transferring ThanksToken:", params);
        // This will be implemented when ThanksToken contract integration is added
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  return {
    isLoading,
    mintThanksToken,
    transferThanksToken,
  };
};
