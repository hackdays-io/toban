import { SPLITS_ABI } from "abi/splits";
import { useCallback, useState } from "react";
import { SplitsInfo } from "utils/types";
import { Address, encodeFunctionData } from "viem";
import { SPLITS_CREATOR_ADDRESS } from "./useContracts";
import { useSmartAccountClient } from "./useSmartWallet";
import { publicClient } from "./useViem";

/**
 * Splits creator 用 React hooks
 */
export const useSplitsCreator = () => {
  const smartAccountClient = useSmartAccountClient();

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Splitsを作成するコールバック関数
   */
  const createSplits = useCallback(
    async (params: { splitsAddress: Address; args: SplitsInfo[] }) => {
      if (!smartAccountClient) return;

      setIsLoading(true);

      try {
        const txHash = await smartAccountClient.sendTransaction({
          calls: [
            {
              to: SPLITS_CREATOR_ADDRESS,
              data: encodeFunctionData({
                abi: SPLITS_ABI,
                functionName: "create",
                args: [params.args],
              }),
            },
          ],
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
    [smartAccountClient]
  );

  return {
    isLoading,
    createSplits,
  };
};
