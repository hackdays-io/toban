import { FRACTION_TOKEN_ABI } from "abi/fractiontoken";
import { HATS_QUEST_MODULE_ABI } from "abi/hatsQuestModule";
import { useCallback, useState } from "react";
import {
  type Address,
  type Log,
  encodeFunctionData,
  parseEventLogs,
  zeroAddress,
} from "viem";
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

/**
 * Pull our own `QuestCreated` ids out of a receipt.
 *
 * A smart-wallet receipt belongs to the *bundle* transaction, so it also
 * carries the logs of every other UserOperation the bundler packed alongside
 * ours. Filtering on the module address plus `creator` is what keeps someone
 * else's questId from being handed back to us. The EOA path runs through the
 * same filter — its receipt is single-sender, but the guard costs nothing.
 */
export const extractMyQuestIds = (
  logs: Log[],
  hatsQuestModuleAddress: Address,
  creator: Address,
): bigint[] => {
  const module = hatsQuestModuleAddress.toLowerCase();
  const me = creator.toLowerCase();
  return parseEventLogs({
    abi: HATS_QUEST_MODULE_ABI,
    eventName: "QuestCreated",
    logs,
    strict: false,
  })
    .filter(
      (log) =>
        log.address.toLowerCase() === module &&
        log.args?.creator?.toLowerCase() === me,
    )
    .map((log) => log.args?.questId)
    .filter((id): id is bigint => typeof id === "bigint");
};

export interface CreateQuestsResult {
  /** Ids of the quests that actually made it on-chain, in creation order. */
  questIds: bigint[];
  /** How many were asked for — compare against `questIds.length` for partials. */
  requested: number;
  /** Set when the run stopped early; `questIds` still holds what succeeded. */
  error?: unknown;
}

/** What the submit button should say while a run is in flight. */
export interface CreateQuestsProgress {
  /** Quests confirmed so far. Stays 0 for `batch`, which is all-or-nothing. */
  done: number;
  requested: number;
  /** `batch` = one UserOperation; `sequential` = one transaction per quest. */
  mode: "batch" | "sequential";
}

export const useCreateQuest = (
  hatsQuestModuleAddress?: Address,
  fractionTokenAddress?: Address,
) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<CreateQuestsProgress>();

  const createQuests = useCallback(
    async (params: {
      hatId: bigint;
      wearer: Address;
      /** Share units escrowed per quest. Total pulled is `amount * count`. */
      amount: bigint;
      metadataUri: string;
      /** How many identical quests to create. Defaults to 1. */
      count?: number;
    }): Promise<CreateQuestsResult | undefined> => {
      if (!hatsQuestModuleAddress || !fractionTokenAddress || !wallet) return;
      const count = Math.max(1, Math.floor(params.count ?? 1));
      const creator = wallet.account.address as Address;
      const isSmartWallet = "sendUserOperation" in wallet;
      setIsLoading(true);
      setProgress({
        done: 0,
        requested: count,
        mode: isSmartWallet ? "batch" : "sequential",
      });
      try {
        // `createQuest` calls `safeTransferFrom(msg.sender, address(this), …)`
        // on the FractionToken — ERC1155 requires the module to be an approved
        // operator of the caller. One read for the whole run, never per quest.
        const approved = (await publicClient.readContract({
          ...fractionTokenBaseConfig(fractionTokenAddress),
          functionName: "isApprovedForAll",
          args: [creator, hatsQuestModuleAddress],
        })) as boolean;

        const createQuestData = encodeFunctionData({
          abi: HATS_QUEST_MODULE_ABI,
          functionName: "createQuest",
          args: [
            params.hatId,
            params.wearer,
            params.amount,
            params.metadataUri,
          ],
        });

        // Privy's smart-wallet client exposes `sendTransaction({ calls: [] })`
        // (ERC-4337 batch). viem's plain WalletClient does not — detect via
        // `sendUserOperation` and fall back to sequential txs for EOA. Same
        // branch as `adminRevokeAuthorityHat` in useHats.
        if (isSmartWallet) {
          // The approval rides in the same UserOp rather than as its own
          // transaction, so the user signs once no matter the starting state.
          const calls = [
            ...(approved
              ? []
              : [
                  {
                    to: fractionTokenAddress,
                    data: encodeFunctionData({
                      abi: FRACTION_TOKEN_ABI,
                      functionName: "setApprovalForAll",
                      args: [hatsQuestModuleAddress, true],
                    }),
                  },
                ]),
            ...Array.from({ length: count }, () => ({
              to: hatsQuestModuleAddress,
              data: createQuestData,
            })),
          ];
          const txHash = await wallet.sendTransaction({ calls });
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });
          // A reverted UserOp still yields a mined bundle receipt, so success
          // is judged by the ids we can read back, not by the receipt arriving.
          // Ours are contiguous, so if this wallet somehow appears twice in the
          // bundle the trailing `count` are the ones we just sent.
          const questIds = extractMyQuestIds(
            receipt.logs,
            hatsQuestModuleAddress,
            creator,
          ).slice(-count);
          setProgress({
            done: questIds.length,
            requested: count,
            mode: "batch",
          });
          // The UserOp is atomic, so a short read means it reverted rather than
          // half-succeeded. Report zero created — never a partial.
          if (questIds.length < count) {
            return {
              questIds: [],
              requested: count,
              error: new Error(
                `batch createQuest reverted: expected ${count} QuestCreated logs, got ${questIds.length}`,
              ),
            };
          }
          return { questIds, requested: count };
        }

        if (!approved) {
          const approveTx = await wallet.writeContract({
            ...fractionTokenBaseConfig(fractionTokenAddress),
            functionName: "setApprovalForAll",
            args: [hatsQuestModuleAddress, true],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }

        // EOA: one transaction per quest. Earlier quests are already on-chain
        // when a later one fails, so we stop at the failure and report the
        // partial rather than pretending the whole run failed.
        const questIds: bigint[] = [];
        for (let i = 0; i < count; i++) {
          try {
            const txHash = await wallet.writeContract({
              ...hatsQuestContractBaseConfig(hatsQuestModuleAddress),
              functionName: "createQuest",
              args: [
                params.hatId,
                params.wearer,
                params.amount,
                params.metadataUri,
              ],
            });
            const receipt = await publicClient.waitForTransactionReceipt({
              hash: txHash,
            });
            questIds.push(
              ...extractMyQuestIds(
                receipt.logs,
                hatsQuestModuleAddress,
                creator,
              ),
            );
            setProgress({
              done: i + 1,
              requested: count,
              mode: "sequential",
            });
          } catch (error) {
            console.error(error);
            return { questIds, requested: count, error };
          }
        }
        return { questIds, requested: count };
      } catch (error) {
        console.error(error);
        return { questIds: [], requested: count, error };
      } finally {
        setIsLoading(false);
      }
    },
    [hatsQuestModuleAddress, fractionTokenAddress, wallet],
  );

  return { createQuests, isLoading, progress };
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
          // Self-service path: submitter = address(0) → the contract records
          // msg.sender as the submitter. Proxy submission (non-zero submitter)
          // is the Discord bot's path, gated to questAgentHat wearers.
          args: [zeroAddress, params.questId, params.membershipHatId],
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
