import { HATS_TIME_FRAME_MODULE_ABI } from "abi/hatsTimeFrameModule";
import { useState } from "react";
import { type Address, parseEventLogs } from "viem";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";

export const useMintHatFromTimeFrameModule = (
  hatsTimeFrameModuleAddress: Address,
) => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  const mintHat = async (hatId: bigint, wearer: Address, time?: bigint) => {
    if (!wallet || !hatId || !wearer) return;

    setIsLoading(true);

    try {
      const txHash = await wallet?.writeContract({
        abi: HATS_TIME_FRAME_MODULE_ABI,
        address: hatsTimeFrameModuleAddress,
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
