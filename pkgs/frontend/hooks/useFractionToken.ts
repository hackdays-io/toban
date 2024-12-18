import { FRACTION_TOKEN_ABI } from "abi/fractiontoken";
import { useCallback, useEffect, useState } from "react";
import { Address, decodeEventLog, encodeFunctionData } from "viem";
import {
  FRACTION_TOKEN_ADDRESS,
  fractionTokenBaseConfig,
} from "./useContracts";
import { useActiveWallet } from "./useWallet";
import { publicClient } from "./useViem";

/**
 * FractionToken 向けの React Hooks
 * @returns
 */
export const useFractionToken = () => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  /**
   * tokenIdを取得するコールバック関数
   * @param hatId
   * @pamra account address
   */
  const getTokenId = useCallback(
    async (params: { hatId: bigint; account: Address }) => {
      if (!wallet) return;

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
    [wallet]
  );

  /**
   * FractionTokenを発行するコールバック関数
   * @param hatId
   * @pamra account address
   */
  const mintFractionToken = useCallback(
    async (params: { hatId: bigint; account: Address }) => {
      if (!wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          ...fractionTokenBaseConfig,
          functionName: "mint",
          args: [params.hatId, params.account],
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
    [wallet]
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
      if (!wallet) return;

      setIsLoading(true);

      try {
        // tokenIdを取得
        const tokenId = await publicClient.readContract({
          ...fractionTokenBaseConfig,
          functionName: "getTokenId",
          args: [params.hatId, params.account],
        });

        // FractionTokenをtransferする。
        const txHash = await wallet.writeContract({
          ...fractionTokenBaseConfig,
          functionName: "safeTransferFrom",
          args: [params.account, params.to, tokenId, params.amount, "0x"],
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
    [wallet]
  );

  return { isLoading, getTokenId, mintFractionToken, sendFractionToken };
};

export const useBalanceOfFractionToken = (
  holder: Address,
  address: Address,
  hatId: bigint
) => {
  const [balance, setBalance] = useState<bigint>();

  useEffect(() => {
    const fetch = async () => {
      if (!holder || !address || !hatId) return;
      try {
        const balance = await publicClient.readContract({
          ...fractionTokenBaseConfig,
          functionName: "balanceOf",
          args: [holder, address, hatId],
        });
        setBalance(balance);
      } catch (error) {
        setBalance(0n);
      }
    };

    fetch();
  }, [holder, hatId, address]);

  return balance;
};
