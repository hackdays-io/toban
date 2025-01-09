import { BIGBANG_ABI } from "abi/bigbang";
import { useCallback, useState } from "react";
import { type Address, parseEventLogs } from "viem";
import { BIGBANG_ADDRESS } from "./useContracts";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";

/**
 * BigBang 向けの React Hooks
 * @returns
 */
export const useBigBang = () => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  /**
   * bigbang 関数を実装するコールバック関数
   */
  const bigbang = useCallback(
    async (params: {
      owner: Address;
      topHatDetails: string;
      topHatImageURI: string;
      hatterHatDetails: string;
      hatterHatImageURI: string;
    }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          abi: BIGBANG_ABI,
          address: BIGBANG_ADDRESS,
          functionName: "bigbang",
          args: [
            params.owner,
            params.topHatDetails,
            params.topHatImageURI,
            params.hatterHatDetails,
            params.hatterHatImageURI,
          ],
        });

        console.log("txHash:", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const parsedLog = parseEventLogs({
          abi: BIGBANG_ABI,
          eventName: "Executed",
          logs: receipt.logs,
          strict: false,
        });

        return parsedLog;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet],
  );

  return { bigbang, isLoading };
};
