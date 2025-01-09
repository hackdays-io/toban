import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { hatsTimeFrameContractBaseConfig } from "./useContracts";
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
        ...hatsTimeFrameContractBaseConfig(hatsTimeFrameModuleAddress),
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

export const useReactivate = (hatsTimeFrameModuleAddress?: string) => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  const reactivate = useCallback(
    async (hatId?: string, wearer?: string) => {
      if (!hatsTimeFrameModuleAddress || !wallet || !hatId || !wearer) return;

      setIsLoading(true);

      try {
        const txHash = await wallet?.writeContract({
          ...hatsTimeFrameContractBaseConfig(
            hatsTimeFrameModuleAddress as Address,
          ),
          functionName: "reactivate",
          args: [BigInt(hatId), wearer as Address],
        });

        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [hatsTimeFrameModuleAddress, wallet],
  );

  return { reactivate, isLoading };
};

export const useDeactivate = (hatsTimeFrameModuleAddress?: string) => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  const deactivate = useCallback(
    async (hatId?: string, wearer?: string) => {
      if (!hatsTimeFrameModuleAddress || !wallet || !hatId || !wearer) return;

      setIsLoading(true);

      try {
        const txHash = await wallet?.writeContract({
          ...hatsTimeFrameContractBaseConfig(
            hatsTimeFrameModuleAddress as Address,
          ),
          functionName: "deactivate",
          args: [BigInt(hatId), wearer as Address],
        });

        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [hatsTimeFrameModuleAddress, wallet],
  );

  return { deactivate, isLoading };
};

export const useActiveState = (
  hatsTimeFrameModuleAddress?: string,
  hatId?: string,
  wearer?: string,
  count?: number,
) => {
  const [activeState, setActiveState] = useState({
    isActive: false,
    woreTime: 0,
    wearingElapsedTime: 0,
  });

  useEffect(() => {
    const fetch = async () => {
      if (!hatsTimeFrameModuleAddress || !hatId || !wearer) return;

      try {
        const [isActive, woreTime, wearingElapsedTime] = await Promise.all([
          publicClient.readContract({
            ...hatsTimeFrameContractBaseConfig(
              hatsTimeFrameModuleAddress as Address,
            ),
            functionName: "isActive",
            args: [BigInt(hatId), wearer as Address],
          }),
          publicClient.readContract({
            ...hatsTimeFrameContractBaseConfig(
              hatsTimeFrameModuleAddress as Address,
            ),
            functionName: "getWoreTime",
            args: [wearer as Address, BigInt(hatId)],
          }),
          publicClient.readContract({
            ...hatsTimeFrameContractBaseConfig(
              hatsTimeFrameModuleAddress as Address,
            ),
            functionName: "getWearingElapsedTime",
            args: [wearer as Address, BigInt(hatId)],
          }),
        ]);

        setActiveState({
          isActive,
          woreTime: Number(woreTime),
          wearingElapsedTime: Number(wearingElapsedTime),
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetch();
  }, [hatsTimeFrameModuleAddress, hatId, wearer]);

  return activeState;
};

export const useWearingElapsedTime = (
  hatsTimeFrameModuleAddress?: Address,
  hatId?: string,
  wearers?: string[],
) => {
  const [wearingElapsedTimeList, setWearingElapsedTimeList] = useState<
    {
      wearer: string;
      time: number;
    }[]
  >([]);

  useEffect(() => {
    const fetch = async () => {
      if (!hatsTimeFrameModuleAddress || !hatId || !wearers) return;

      try {
        const list = await Promise.all(
          wearers.map(async (w) => {
            const time = Number(
              await publicClient.readContract({
                ...hatsTimeFrameContractBaseConfig(
                  hatsTimeFrameModuleAddress as Address,
                ),
                functionName: "getWearingElapsedTime",
                args: [w as Address, BigInt(hatId)],
              }),
            );

            return { wearer: w, time };
          }),
        );

        setWearingElapsedTimeList(list);
      } catch (error) {
        console.error(error);
      }
    };

    fetch();
  }, [hatsTimeFrameModuleAddress, hatId, wearers]);

  return wearingElapsedTimeList;
};
