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
import { useSmartAccountClient } from "./useWallet";
import { publicClient } from "./useViem";

/**
 * BigBang 向けの React Hooks
 * @returns
 */
export const useBigBang = () => {
  const smartAccountClient = useSmartAccountClient();

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
      trustedForwarder: Address;
    }) => {
      if (!smartAccountClient) return;

      setIsLoading(true);

      try {
        const txHash = await smartAccountClient.sendTransaction({
          calls: [
            {
              to: BIGBANG_ADDRESS,
              data: encodeFunctionData({
                abi: BIGBANG_ABI,
                functionName: "bigbang",
                args: [
                  params.owner,
                  params.topHatDetails,
                  params.topHatImageURI,
                  params.hatterHatDetails,
                  params.hatterHatImageURI,
                  params.trustedForwarder,
                ],
              }),
            },
          ],
        });

        console.log("txHash:", txHash);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        console.log("receipt:", receipt);

        // @help イベントが取れない（undefinedになる）
        const parsedLog = parseEventLogs({
          abi: BIGBANG_ABI,
          eventName: "Executed",
          logs: receipt.logs,
          strict: false,
        });

        console.log("parsedLog:", parsedLog);

        if (parsedLog) {
          console.log("parsedLog.args:", parsedLog.args);
          // console.log(
          //   "Tree Link:",
          //   `https://app.hatsprotocol.xyz/trees/${String(
          //     publicClient.chain?.id
          //   )}/${hatIdToTreeId(BigInt(parsedLog.args.topHatId))}`
          // );
        }

        return parsedLog;
      } finally {
        setIsLoading(false);
      }
    },
    [smartAccountClient]
  );

  return { bigbang, isLoading };
};
