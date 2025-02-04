import { HATS_ABI } from "abi/hats";
import { useCallback, useState } from "react";
import { type Address, parseEventLogs } from "viem";
import { hatsHatCreatorContractBaseConfig } from "./useContracts";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";

export const useCreateHatFromHatCreatorModule = (
  hatsHatCreatorModuleAddress: Address,
) => {
  const { wallet } = useActiveWallet();

  const [isLoading, setIsLoading] = useState(false);

  const createHat = useCallback(
    async (params: {
      parentHatId: bigint;
      details?: string;
      maxSupply?: number;
      eligibility?: Address;
      toggle?: Address;
      mutable?: boolean;
      imageURI?: string;
    }) => {
      if (!hatsHatCreatorModuleAddress || !wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet?.writeContract({
          ...hatsHatCreatorContractBaseConfig(
            hatsHatCreatorModuleAddress as Address,
          ),
          functionName: "createHat",
          args: [
            params.parentHatId,
            params.details || "",
            params.maxSupply || 5,
            params.eligibility || "0x0000000000000000000000000000000000004a75",
            params.toggle || "0x0000000000000000000000000000000000004a75",
            params.mutable || true,
            params.imageURI || "",
          ],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        const parsedLog = parseEventLogs({
          abi: HATS_ABI,
          eventName: "HatCreated",
          logs: receipt.logs,
          strict: false,
        });

        return parsedLog;
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [hatsHatCreatorModuleAddress, wallet],
  );

  return { createHat, isLoading };
};

export const useGrantCreateHatAuthority = (
  hatsHatCreatorModuleAddress: Address,
) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);

  const grantCreateHatAuthority = useCallback(
    async (authority: Address) => {
      if (!hatsHatCreatorModuleAddress || !wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          ...hatsHatCreatorContractBaseConfig(
            hatsHatCreatorModuleAddress as Address,
          ),
          functionName: "grantCreateHatAuthority",
          args: [authority],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        return receipt;
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [hatsHatCreatorModuleAddress, wallet],
  );

  return { grantCreateHatAuthority, isLoading };
};

export const useRevokeCreateHatAuthority = (
  hatsHatCreatorModuleAddress: Address,
) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);

  const revokeCreateHatAuthority = useCallback(
    async (authority: Address) => {
      if (!hatsHatCreatorModuleAddress || !wallet) return;

      setIsLoading(true);

      try {
        const txHash = await wallet.writeContract({
          ...hatsHatCreatorContractBaseConfig(
            hatsHatCreatorModuleAddress as Address,
          ),
          functionName: "revokeCreateHatAuthority",
          args: [authority],
        });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });

        return receipt;
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [hatsHatCreatorModuleAddress, wallet],
  );

  return { revokeCreateHatAuthority, isLoading };
};
