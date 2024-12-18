import { hatIdToTreeId } from "@hatsprotocol/sdk-v1-core";
import { BIGBANG_ABI } from "abi/bigbang";
import { useCallback, useState } from "react";
import {
  Address,
  decodeEventLog,
  encodeFunctionData,
  parseEventLogs,
} from "viem";
import { BIGBANG_ADDRESS } from "./useContracts";
import { useActiveWallet } from "./useWallet";
import { publicClient } from "./useViem";

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

      console.log("wallet", wallet);
      console.log("params", params);

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
        console.log("receipt:", receipt);

        const parsedLog = parseEventLogs({
          abi: BIGBANG_ABI,
          eventName: "Executed",
          logs: receipt.logs,
          strict: false,
        });

        console.log("parsedLog:", parsedLog);

        return parsedLog;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet]
  );

  return { bigbang, isLoading };
};
