import { FRACTION_TOKEN_ABI } from "abi/fractiontoken";
import { useCallback, useState } from "react";
import { Address, decodeEventLog, encodeFunctionData } from "viem";
import {
  FRACTION_TOKEN_ADDRESS,
  fractionTokenBaseConfig,
} from "./useContracts";
import { useSmartAccountClient } from "./useSmartWallet";
import { publicClient } from "./useViem";

/**
 * FractionToken 向けの React Hooks
 * @returns
 */
export const useFractionToken = () => {
  const smartAccountClient = useSmartAccountClient();

  const [isLoading, setIsLoading] = useState(false);

  /**
   * tokenIdを取得するコールバック関数
   * @param hatId
   * @pamra account address
   */
  const getTokenId = useCallback(
    async (params: { hatId: bigint; account: Address }) => {
      if (!smartAccountClient) return;

      setIsLoading(true);

      try {
        const res = await publicClient.readContract({
          ...fractionTokenBaseConfig,
          functionName: "getTokenId",
          args: [params.hatId, params.account],
        });

        return res;
      } catch (error) {
        console.error("error occured when fetching tokenId:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [smartAccountClient]
  );

  /**
   * FractionTokenを発行するコールバック関数
   * @param hatId
   * @pamra account address
   */
  const mintFractionToken = useCallback(
    async (params: { hatId: bigint; account: Address }) => {
      if (!smartAccountClient) return;

      setIsLoading(true);

      try {
        const txHash = await smartAccountClient.sendTransaction({
          calls: [
            {
              to: FRACTION_TOKEN_ADDRESS,
              data: encodeFunctionData({
                abi: FRACTION_TOKEN_ABI,
                functionName: "mint",
                args: [params.hatId, params.account],
              }),
            },
          ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const log = receipt.logs.find((log) => {
          try {
            const decodedLog = decodeEventLog({
              abi: FRACTION_TOKEN_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decodedLog.eventName === "TransferSingle";
          } catch (error) {
            console.error("error occured when minting FractionToken:", error);
          }
        })!;

        if (log) {
          const decodedLog = decodeEventLog({
            abi: FRACTION_TOKEN_ABI,
            data: log.data,
            topics: log.topics,
          });
          console.log({ decodedLog });
        }
        return txHash;
      } finally {
        setIsLoading(false);
      }
    },
    [smartAccountClient]
  );

  /**
   * FractionTokenを送信するコールバック関数
   * @param hatId
   * @pamra account address
   * @param to recipient address
   * @param amount amount of token
   */
  const sendFractionToken = useCallback(
    async (params: {
      hatId: bigint;
      account: Address;
      to: Address;
      amount: bigint;
    }) => {
      if (!smartAccountClient) return;

      setIsLoading(true);

      try {
        // tokenIdを取得
        const tokenId = await publicClient.readContract({
          ...fractionTokenBaseConfig,
          functionName: "getTokenId",
          args: [params.hatId, params.account],
        });

        // FractionTokenをtransferする。
        const txHash = await smartAccountClient.sendTransaction({
          calls: [
            {
              to: FRACTION_TOKEN_ADDRESS,
              data: encodeFunctionData({
                abi: FRACTION_TOKEN_ABI,
                functionName: "safeTransferFrom",
                args: [params.account, params.to, tokenId, params.amount, "0x"],
              }),
            },
          ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const log = receipt.logs.find((log) => {
          try {
            const decodedLog = decodeEventLog({
              abi: FRACTION_TOKEN_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decodedLog.eventName === "TransferSingle";
          } catch (error) {
            console.error("error occured when minting FractionToken:", error);
          }
        })!;

        if (log) {
          const decodedLog = decodeEventLog({
            abi: FRACTION_TOKEN_ABI,
            data: log.data,
            topics: log.topics,
          });
          console.log({ decodedLog });
        }
        return txHash;
      } finally {
        setIsLoading(false);
      }
    },
    [smartAccountClient]
  );

  return { isLoading, getTokenId, mintFractionToken, sendFractionToken };
};
