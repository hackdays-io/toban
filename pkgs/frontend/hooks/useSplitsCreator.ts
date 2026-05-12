import type { Split } from "@0xsplits/splits-sdk";
import { useQuery } from "@tanstack/react-query";
import { SPLITS_CREATOR_ABI } from "abi/splits";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getSplitsWriteClient, splitsDataClient } from "utils/splits";
import { type AbiItemArgs, type Address, parseEventLogs } from "viem";
import { currentChain, publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";
import { useGetWorkspace } from "./useWorkspace";

/**
 * Splits creator 用 React hooks
 */
export const useSplitsCreator = (treeId: string) => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  const { data } = useGetWorkspace({ workspaceId: treeId });
  const splitsCreatorAddress = useMemo(() => {
    return data?.workspace?.splitCreator as Address;
  }, [data?.workspace?.splitCreator]);

  const previewSplits = async (
    args: AbiItemArgs<typeof SPLITS_CREATOR_ABI, "preview">,
  ) => {
    const res = await publicClient.readContract({
      address: splitsCreatorAddress,
      abi: SPLITS_CREATOR_ABI,
      functionName: "preview",
      args,
    });

    return res;
  };

  /**
   * Splitsを作成するコールバック関数
   */
  const createSplits = useCallback(
    async (params: {
      args: AbiItemArgs<typeof SPLITS_CREATOR_ABI, "create">;
    }) => {
      if (!wallet || !splitsCreatorAddress) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          address: splitsCreatorAddress,
          abi: SPLITS_CREATOR_ABI,
          functionName: "create",
          args: params.args,
        });

        console.log("txHash:", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const parsedLog = parseEventLogs({
          abi: SPLITS_CREATOR_ABI,
          eventName: "SplitsCreated",
          logs: receipt.logs,
          strict: false,
        });

        return parsedLog;
      } catch (error) {
        console.error("error occured when creating Splits:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [splitsCreatorAddress, wallet],
  );

  return {
    isLoading,
    createSplits,
    previewSplits,
  };
};

export const useSplitsCreatorRelatedSplits = (splitsCreator?: Address) => {
  const [isLoading, setIsLoading] = useState(false);
  const [splits, setSplits] = useState<Split[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        if (!splitsCreator) return;
        const res = await splitsDataClient?.getRelatedSplits({
          address: splitsCreator,
          chainId: currentChain.id,
        });

        if (res) {
          setSplits(res.controlling);
        }
      } catch (error) {
        console.error("error occured when fetching splits:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [splitsCreator]);

  return { isLoading, splits };
};

export const useSplit = (contractAddress: Address | undefined) => {
  const { wallet } = useActiveWallet();

  const splitEarnings = useQuery({
    queryKey: ["split", contractAddress],
    // React Query forbids `undefined` returns from a queryFn — gate via
    // `enabled` so we never enter the function without a real address.
    enabled: !!contractAddress && !!splitsDataClient,
    queryFn: async () => {
      if (!contractAddress || !splitsDataClient) return null;
      try {
        // Omit `erc20TokenList` so the SDK auto-discovers every ERC20 ever
        // transferred to this split via `getLogs` (requires the Alchemy-backed
        // public client, wired up in `utils/splits.ts`).
        const res = await splitsDataClient.getSplitEarnings({
          chainId: currentChain.id,
          splitAddress: contractAddress.toLocaleLowerCase(),
        });
        return res ?? null;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const [isDistributing, setIsDistributing] = useState(false);
  const distribute = useCallback(
    async (tokenAddress: Address) => {
      if (!wallet || !contractAddress) return;
      setIsDistributing(true);
      const client = getSplitsWriteClient(wallet);
      await client.splitV2.distribute({
        splitAddress: contractAddress,
        tokenAddress,
        distributorAddress: wallet.account.address,
      });
      toast.success("Success");
      setIsDistributing(false);
      setTimeout(async () => {
        await splitEarnings.refetch();
      }, 5000);
    },
    [wallet, contractAddress, splitEarnings],
  );

  return { splitEarnings, distribute, isDistributing };
};

export const useUserEarnings = () => {
  const { wallet } = useActiveWallet();

  const userEarnings = useQuery({
    queryKey: ["userEarnings"],
    queryFn: async () => {
      if (!wallet || !splitsDataClient) return null;
      try {
        const res = await splitsDataClient.getUserEarnings({
          chainId: currentChain.id,
          userAddress: wallet.account.address,
        });
        return res ?? null;
      } catch (error) {
        console.log(error);
        return null;
      }
    },
    enabled: !!wallet && !!splitsDataClient,
  });

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const withdraw = useCallback(
    async (tokenAddress: Address) => {
      if (!wallet) return;
      setIsWithdrawing(true);
      const client = getSplitsWriteClient(wallet);
      await client.warehouse.withdraw({
        tokenAddress,
        ownerAddress: wallet.account.address,
      });
      toast.success("Success");
      setIsWithdrawing(false);
      setTimeout(async () => {
        await userEarnings.refetch();
      }, 5000);
    },
    [wallet, userEarnings],
  );

  return { userEarnings, withdraw, isWithdrawing };
};
