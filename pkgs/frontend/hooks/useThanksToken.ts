import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { Address } from "viem";
import { thanksTokenBaseConfig } from "./useContracts";
import { useBalanceOfFractionTokens } from "./useFractionToken";
import { useTreeInfo } from "./useHats";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";
import { useGetWorkspace } from "./useWorkspace";

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

export const useUserThanksTokenBalance = (workspaceId?: string) => {
  // Placeholder for now - this hook was in the HEAD version but not implemented
  return {
    balance: 0,
    data: null,
  };
};

export const useThanksTokenActivity = (workspaceId?: string, limit = 10) => {
  // Placeholder for now - this hook was in the HEAD version but not implemented
  return {
    activities: [] as Array<{
      type: "transfer" | "mint";
      from?: string;
      to: string;
      amount: string;
      blockTimestamp: string;
      thanksToken: {
        symbol: string;
      };
    }>,
    isLoading: false,
  };
};
