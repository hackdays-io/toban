import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import type {
  GetTransferThanksTokensQuery,
  GetTransferThanksTokensQueryVariables,
  OrderDirection,
  TransferThanksToken_Filter,
  TransferThanksToken_OrderBy,
} from "gql/graphql";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { formatEther } from "viem";
import type { Address } from "viem";
import { thanksTokenBaseConfig } from "./useContracts";
import { useBalanceOfFractionTokens } from "./useFractionToken";
import { useTreeInfo } from "./useHats";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";
import { useGetWorkspace } from "./useWorkspace";

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
  const convertAmountInResponse = (
    data: GetTransferThanksTokensQuery | undefined,
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

export const useThanksToken = (treeId: string) => {
  const { data } = useGetWorkspace(treeId);
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

  const { data: balanceOfFractionTokens } = useBalanceOfFractionTokens({
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
      if (!relatedRoles.length || !data?.workspace?.thanksToken.id) return;

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
    async (to: Address, amount: bigint) => {
      if (!wallet || !relatedRoles.length) return;
      setIsLoading(true);

      let txHash: `0x${string}` | undefined = undefined;
      let error = "";

      try {
        txHash = await wallet.writeContract({
          ...thanksTokenBaseConfig(
            data?.workspace?.thanksToken.id as `0x${string}`,
          ),
          functionName: "mint",
          args: [to, amount, relatedRoles],
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        setIsLoading(false);
      } catch (_) {
        error = "トークンの送信に失敗しました";
        setIsLoading(false);
      }

      return { txHash, error };
    },
    [relatedRoles, wallet, data?.workspace?.thanksToken.id],
  );

  return { mintableAmount, mintThanksToken, isLoading };
};
