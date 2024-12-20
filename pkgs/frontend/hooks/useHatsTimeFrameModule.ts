import { HATS_TIME_FRAME_MODULE_ABI } from "abi/hatsTimeFrameModule";
import { useActiveWallet } from "./useWallet";
import { Address, parseEventLogs } from "viem";
import { useState } from "react";
import { publicClient } from "./useViem";

export const useMintHatFromTimeFrameModule = () => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  const mintHat = async (hatId: bigint, wearer: Address, time?: bigint) => {
    if (!wallet || !hatId || !wearer) return;

    setIsLoading(true);

    try {
      const txHash = await wallet?.writeContract({
        abi: HATS_TIME_FRAME_MODULE_ABI,
        address: "0xa192116b30ece60149039d2095594a7c0af9500f" as any,
        functionName: "mintHat",
        args: [hatId, wearer, time || BigInt(0)],
      });

      await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { mintHat, isLoading };
};
