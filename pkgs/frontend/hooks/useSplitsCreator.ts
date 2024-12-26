import { SPLITS_CREATOR_ABI } from "abi/splits";
import { useCallback, useMemo, useState } from "react";
import { AbiItemArgs, Address, encodeFunctionData } from "viem";
import { useActiveWallet, useSmartAccountClient } from "./useWallet";
import { publicClient } from "./useViem";
import { useGetWorkspace } from "./useWorkspace";

/**
 * Splits creator 用 React hooks
 */
export const useSplitsCreator = (treeId: string) => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  const { data } = useGetWorkspace(treeId);
  const splitsCreatorAddress = useMemo(() => {
    return data?.workspace?.splitCreator as Address;
  }, [data?.workspace?.splitCreator]);

  const previewSplits = async (
    args: AbiItemArgs<typeof SPLITS_CREATOR_ABI, "preview">[0]
  ) => {
    const res = await publicClient.readContract({
      address: splitsCreatorAddress,
      abi: SPLITS_CREATOR_ABI,
      functionName: "preview",
      args: [args],
    });

    return res;
  };

  /**
   * Splitsを作成するコールバック関数
   */
  const createSplits = useCallback(
    async (params: {
      args: AbiItemArgs<typeof SPLITS_CREATOR_ABI, "create">[0];
    }) => {
      if (!wallet || !splitsCreatorAddress) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          address: splitsCreatorAddress,
          abi: SPLITS_CREATOR_ABI,
          functionName: "create",
          args: [params.args],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        console.log({ receipt });

        return txHash;
      } catch (error) {
        console.error("error occured when creating Splits:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [splitsCreatorAddress, wallet]
  );

  return {
    isLoading,
    createSplits,
    previewSplits,
  };
};
