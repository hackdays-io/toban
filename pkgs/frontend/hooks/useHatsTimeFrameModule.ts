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

export const useRenounceHatFromTimeFrameModule = (
  hatsTimeFrameModuleAddress: Address,
) => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  const renounceHat = useCallback(
    async (hatId: bigint, wearer: Address) => {
      if (!wallet || !hatId || !wearer) return;

      setIsLoading(true);

      try {
        const txHash = await wallet?.writeContract({
          ...hatsTimeFrameContractBaseConfig(hatsTimeFrameModuleAddress),
          functionName: "renounce",
          args: [hatId, wearer],
        });

        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
      } catch (error) {
        throw new Error("Failed to renounce hat");
      } finally {
        setIsLoading(false);
      }
    },
    [hatsTimeFrameModuleAddress, wallet],
  );

  return { renounceHat, isLoading };
};

export const useGrantOperationAuthority = (hatsTimeFrameModuleAddress: Address) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const grantOperationAuthority = useCallback(
    async (authority: Address) => {
      if (!hatsTimeFrameModuleAddress || !wallet) return;

      setIsLoading(true);
      setIsSuccess(false);

      try {
        const txHash = await wallet?.writeContract({
          ...hatsTimeFrameContractBaseConfig(hatsTimeFrameModuleAddress),
          functionName: "grantOperationAuthority",
          args: [authority],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        setIsSuccess(true);

        return receipt;
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [hatsTimeFrameModuleAddress, wallet]
  );

  return { grantOperationAuthority, isLoading, isSuccess };
};

export const useRevokeOperationAuthority = (hatsTimeFrameModuleAddress: Address) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const revokeOperationAuthority = useCallback(
    async (authority: Address) => {
      if (!hatsTimeFrameModuleAddress || !wallet) return;

      setIsLoading(true);
      setIsSuccess(false);

      try {
        const txHash = await wallet?.writeContract({
          ...hatsTimeFrameContractBaseConfig(hatsTimeFrameModuleAddress),
          functionName: "revokeOperationAuthority",
          args: [authority],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        setIsSuccess(true);

        return receipt;
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [hatsTimeFrameModuleAddress, wallet]
  );

  return { revokeOperationAuthority, isLoading, isSuccess };
};
