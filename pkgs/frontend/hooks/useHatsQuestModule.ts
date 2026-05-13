import { HATS_QUEST_MODULE_ABI } from "abi/hatsQuestModule";
import { useCallback, useState } from "react";
import { type Address, parseEventLogs } from "viem";
import {
  fractionTokenBaseConfig,
  hatsQuestContractBaseConfig,
} from "./useContracts";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";

// All HatsQuestModule writes follow the same shape: viem writeContract via
// the active wallet → wait for receipt → optionally parseEventLogs for the
// id we need on the next screen. We split one hook per action so callers can
// import only what they need, mirroring useHatsHatCreatorModule.

export const useCreateQuest = (
  hatsQuestModuleAddress?: Address,
  fractionTokenAddress?: Address,
) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);

  const createQuest = useCallback(
    async (params: {
      hatId: bigint;
      wearer: Address;
      amount: bigint;
      metadataHash: `0x${string}`;
    }): Promise<bigint | undefined> => {
      if (!hatsQuestModuleAddress || !fractionTokenAddress || !wallet) return;
      setIsLoading(true);
      try {
        // `createQuest` calls `safeTransferFrom(msg.sender, address(this), …)`
        // on the FractionToken — ERC1155 requires the module to be an approved
        // operator of the caller. Approve once (idempotent) before escrowing.
        const approved = (await publicClient.readContract({
          ...fractionTokenBaseConfig(fractionTokenAddress),
          functionName: "isApprovedForAll",
          args: [wallet.account.address as Address, hatsQuestModuleAddress],
        })) as boolean;
        if (!approved) {
          const approveTx = await wallet.writeContract({
            ...fractionTokenBaseConfig(fractionTokenAddress),
            functionName: "setApprovalForAll",
            args: [hatsQuestModuleAddress, true],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }

        const txHash = await wallet.writeContract({
          ...hatsQuestContractBaseConfig(hatsQuestModuleAddress),
          functionName: "createQuest",
          args: [
            params.hatId,
            params.wearer,
            params.amount,
            params.metadataHash,
          ],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
        const logs = parseEventLogs({
          abi: HATS_QUEST_MODULE_ABI,
          eventName: "QuestCreated",
          logs: receipt.logs,
          strict: false,
        });
        return logs[0]?.args?.questId;
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [hatsQuestModuleAddress, fractionTokenAddress, wallet],
  );

  return { createQuest, isLoading };
};

export const useSubmitQuestCompletion = (hatsQuestModuleAddress?: Address) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitCompletion = useCallback(
    async (params: { questId: bigint; membershipHatId: bigint }) => {
      if (!hatsQuestModuleAddress || !wallet) return;
      setIsLoading(true);
      setIsSuccess(false);
      try {
        const txHash = await wallet.writeContract({
          ...hatsQuestContractBaseConfig(hatsQuestModuleAddress),
          functionName: "submitCompletion",
          args: [params.questId, params.membershipHatId],
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
    [hatsQuestModuleAddress, wallet],
  );

  return { submitCompletion, isLoading, isSuccess };
};

export const useWithdrawQuestSubmission = (
  hatsQuestModuleAddress?: Address,
) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const withdrawSubmission = useCallback(
    async (questId: bigint) => {
      if (!hatsQuestModuleAddress || !wallet) return;
      setIsLoading(true);
      setIsSuccess(false);
      try {
        const txHash = await wallet.writeContract({
          ...hatsQuestContractBaseConfig(hatsQuestModuleAddress),
          functionName: "withdrawSubmission",
          args: [questId],
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
    [hatsQuestModuleAddress, wallet],
  );

  return { withdrawSubmission, isLoading, isSuccess };
};

export const useRejectQuestSubmission = (hatsQuestModuleAddress?: Address) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const rejectSubmission = useCallback(
    async (questId: bigint) => {
      if (!hatsQuestModuleAddress || !wallet) return;
      setIsLoading(true);
      setIsSuccess(false);
      try {
        const txHash = await wallet.writeContract({
          ...hatsQuestContractBaseConfig(hatsQuestModuleAddress),
          functionName: "rejectSubmission",
          args: [questId],
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
    [hatsQuestModuleAddress, wallet],
  );

  return { rejectSubmission, isLoading, isSuccess };
};

export const useApproveQuest = (hatsQuestModuleAddress?: Address) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const approve = useCallback(
    async (params: { questId: bigint; membershipHatId: bigint }) => {
      if (!hatsQuestModuleAddress || !wallet) return;
      setIsLoading(true);
      setIsSuccess(false);
      try {
        const txHash = await wallet.writeContract({
          ...hatsQuestContractBaseConfig(hatsQuestModuleAddress),
          functionName: "approve",
          args: [params.questId, params.membershipHatId],
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
    [hatsQuestModuleAddress, wallet],
  );

  return { approve, isLoading, isSuccess };
};

export const useCancelQuest = (hatsQuestModuleAddress?: Address) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const cancel = useCallback(
    async (questId: bigint) => {
      if (!hatsQuestModuleAddress || !wallet) return;
      setIsLoading(true);
      setIsSuccess(false);
      try {
        const txHash = await wallet.writeContract({
          ...hatsQuestContractBaseConfig(hatsQuestModuleAddress),
          functionName: "cancel",
          args: [questId],
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
    [hatsQuestModuleAddress, wallet],
  );

  return { cancel, isLoading, isSuccess };
};
