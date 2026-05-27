import { gql } from "@apollo/client/core";
import { useQuery } from "@apollo/client/react/hooks";
import { ERC20_ABI } from "abi/erc20";
import {
  SCHEDULED_DISTRIBUTOR_ABI,
  SCHEDULED_DISTRIBUTOR_FACTORY_ABI,
} from "abi/scheduledDistributor";
import { SPLITS_CREATOR_ABI } from "abi/splits";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { type AbiItemArgs, type Address, type Hex, parseEventLogs } from "viem";
import { SCHEDULED_DISTRIBUTOR_FACTORY_ADDRESS } from "./useContracts";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";

const SCHEDULED_DISTRIBUTORS_BY_WORKSPACE = gql(`
  query GetScheduledDistributorsByWorkspace($workspaceId: ID!) {
    scheduledDistributors(where: { workspaceId: $workspaceId }, orderBy: scheduledDate, orderDirection: desc) {
      id
      scheduler
      splitsCreator
      workspaceId
      tokens
      backupWallet
      scheduledDate
      status
      split
      executedAt
      reclaimedAt
      createdAt
      createdBlock
      tokenBalances {
        id
        token
        totalDeposited
        executedAmount
        reclaimedAmount
        updatedAt
      }
    }
  }
`);

const SCHEDULED_DISTRIBUTOR_DETAIL = gql(`
  query GetScheduledDistributor($id: ID!) {
    scheduledDistributor(id: $id) {
      id
      scheduler
      splitsCreator
      workspaceId
      tokens
      backupWallet
      scheduledDate
      status
      split
      executedAt
      reclaimedAt
      createdAt
      createdBlock
      tokenBalances {
        id
        token
        totalDeposited
        executedAmount
        reclaimedAmount
        updatedAt
      }
      deposits(orderBy: blockTimestamp, orderDirection: desc) {
        id
        token
        from
        amount
        blockTimestamp
        txHash
      }
    }
  }
`);

export type ScheduledDistributorTokenBalanceRow = {
  id: string;
  token: string;
  totalDeposited: string;
  executedAmount?: string | null;
  reclaimedAmount?: string | null;
  updatedAt: string;
};

export type ScheduledDistributorRow = {
  id: Address;
  scheduler: string;
  splitsCreator: string;
  workspaceId?: string | null;
  tokens: string[];
  backupWallet: string;
  scheduledDate: string;
  status: "Pending" | "Executed" | "Reclaimed";
  split?: string | null;
  executedAt?: string | null;
  reclaimedAt?: string | null;
  createdAt: string;
  createdBlock: string;
  tokenBalances: ScheduledDistributorTokenBalanceRow[];
};

export type ScheduledDistributorDetail = ScheduledDistributorRow & {
  deposits: Array<{
    id: string;
    token: string;
    from: string;
    amount: string;
    blockTimestamp: string;
    txHash: string;
  }>;
};

/** List of scheduled distributors for a workspace (subgraph-backed). */
export const useScheduledDistributorsByWorkspace = (workspaceId?: string) => {
  const result = useQuery<{
    scheduledDistributors: ScheduledDistributorRow[];
  }>(SCHEDULED_DISTRIBUTORS_BY_WORKSPACE, {
    variables: { workspaceId },
    skip: !workspaceId,
  });
  return result;
};

/** Detail of a single scheduled distributor (subgraph-backed). */
export const useScheduledDistributorDetail = (id?: string) => {
  const result = useQuery<{
    scheduledDistributor: ScheduledDistributorDetail | null;
  }>(SCHEDULED_DISTRIBUTOR_DETAIL, {
    variables: { id: id?.toLowerCase() },
    skip: !id,
  });
  return result;
};

export type ScheduledDistributorRule = {
  scheduler: Address;
  splitsCreator: Address;
  tokens: Address[];
  backupWallet: Address;
  scheduledDate: bigint;
  hatIds: bigint[];
  multiplierTops: bigint[];
  multiplierBottoms: bigint[];
  weights: {
    roleWeight: bigint;
    thanksTokenWeight: bigint;
    thanksTokenReceivedWeight: bigint;
    thanksTokenSentWeight: bigint;
  };
  confirmedWearers: Address[][];
  executed: boolean;
  reclaimed: boolean;
  split: Address;
  /** Live ERC20 balanceOf(distributor) per token (same order as `tokens`). */
  tokenBalances: bigint[];
};

/** Standalone reader for a ScheduledDistributor clone — usable outside a
 *  React hook (e.g. inside a useQueries `queryFn`). */
export const readScheduledDistributorRule = async (
  distributor: Address,
): Promise<ScheduledDistributorRule> => {
  const base = {
    address: distributor,
    abi: SCHEDULED_DISTRIBUTOR_ABI,
  } as const;
  const [
    scheduler,
    splitsCreator,
    tokens,
    backupWallet,
    scheduledDate,
    hatIds,
    multiplierTops,
    multiplierBottoms,
    weightsRaw,
    confirmedWearers,
    executed,
    reclaimed,
    split,
  ] = await Promise.all([
    publicClient.readContract({ ...base, functionName: "scheduler" }),
    publicClient.readContract({ ...base, functionName: "splitsCreator" }),
    publicClient.readContract({ ...base, functionName: "getTokens" }),
    publicClient.readContract({ ...base, functionName: "backupWallet" }),
    publicClient.readContract({ ...base, functionName: "scheduledDate" }),
    publicClient.readContract({ ...base, functionName: "getHatIds" }),
    publicClient.readContract({ ...base, functionName: "getMultiplierTops" }),
    publicClient.readContract({
      ...base,
      functionName: "getMultiplierBottoms",
    }),
    publicClient.readContract({ ...base, functionName: "weights" }),
    publicClient.readContract({
      ...base,
      functionName: "getAllConfirmedWearers",
    }),
    publicClient.readContract({ ...base, functionName: "executed" }),
    publicClient.readContract({ ...base, functionName: "reclaimed" }),
    publicClient.readContract({ ...base, functionName: "split" }),
  ]);

  const tokenList = tokens as readonly Address[];
  const tokenBalances = await Promise.all(
    tokenList.map((t) =>
      publicClient.readContract({
        address: t,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [distributor],
      }),
    ),
  );

  return {
    scheduler: scheduler as Address,
    splitsCreator: splitsCreator as Address,
    tokens: [...tokenList] as Address[],
    backupWallet: backupWallet as Address,
    scheduledDate: scheduledDate as bigint,
    hatIds: hatIds as bigint[],
    multiplierTops: multiplierTops as bigint[],
    multiplierBottoms: multiplierBottoms as bigint[],
    weights: {
      roleWeight: (weightsRaw as readonly bigint[])[0],
      thanksTokenWeight: (weightsRaw as readonly bigint[])[1],
      thanksTokenReceivedWeight: (weightsRaw as readonly bigint[])[2],
      thanksTokenSentWeight: (weightsRaw as readonly bigint[])[3],
    },
    confirmedWearers: confirmedWearers as Address[][],
    executed: executed as boolean,
    reclaimed: reclaimed as boolean,
    split: split as Address,
    tokenBalances: tokenBalances as bigint[],
  };
};

/** Standalone SplitsCreator.preview() invocation against a rule. */
export const previewScheduledDistributorRule = async (
  rule: ScheduledDistributorRule,
  wearersByHat: Address[][],
) => {
  const splitsInfo = rule.hatIds.map((hatId, i) => ({
    hatId,
    multiplierBottom: rule.multiplierBottoms[i],
    multiplierTop: rule.multiplierTops[i],
    wearers: wearersByHat[i],
  }));
  const args = [splitsInfo, rule.weights] as AbiItemArgs<
    typeof SPLITS_CREATOR_ABI,
    "preview"
  >;
  return await publicClient.readContract({
    address: rule.splitsCreator,
    abi: SPLITS_CREATOR_ABI,
    functionName: "preview",
    args,
  });
};

/** Read-side: pull the rule + status from a ScheduledDistributor clone. */
export const useScheduledDistributor = (distributor?: Address) => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);

  const readRule = useCallback(
    async (): Promise<ScheduledDistributorRule | null> =>
      distributor ? readScheduledDistributorRule(distributor) : null,
    [distributor],
  );

  const previewWithRule = useCallback(
    (rule: ScheduledDistributorRule, wearersByHat: Address[][]) =>
      previewScheduledDistributorRule(rule, wearersByHat),
    [],
  );

  const deposit = useCallback(
    async (token: Address, amount: bigint) => {
      if (!wallet || !distributor) return;
      setIsLoading(true);
      try {
        const approveTx = await wallet.writeContract({
          address: token,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [distributor, amount],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });

        const depositTx = await wallet.writeContract({
          address: distributor,
          abi: SCHEDULED_DISTRIBUTOR_ABI,
          functionName: "deposit",
          args: [token, amount],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: depositTx,
        });
        toast.success("Deposit confirmed");
        return receipt;
      } catch (e) {
        console.error(e);
        toast.error("Deposit failed");
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, distributor],
  );

  const execute = useCallback(
    async (wearersByHat: Address[][]) => {
      if (!wallet || !distributor) return;
      setIsLoading(true);
      try {
        const tx = await wallet.writeContract({
          address: distributor,
          abi: SCHEDULED_DISTRIBUTOR_ABI,
          functionName: "execute",
          args: [wearersByHat],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });
        toast.success("Distribution executed");
        return receipt;
      } catch (e) {
        console.error(e);
        toast.error("Execute failed");
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, distributor],
  );

  const reclaim = useCallback(async () => {
    if (!wallet || !distributor) return;
    setIsLoading(true);
    try {
      const tx = await wallet.writeContract({
        address: distributor,
        abi: SCHEDULED_DISTRIBUTOR_ABI,
        functionName: "reclaim",
        args: [],
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });
      toast.success("Reclaim complete");
      return receipt;
    } catch (e) {
      console.error(e);
      toast.error("Reclaim failed");
    } finally {
      setIsLoading(false);
    }
  }, [wallet, distributor]);

  return {
    isLoading,
    readRule,
    previewWithRule,
    deposit,
    execute,
    reclaim,
  };
};

export type CreateScheduledDistributorParams = {
  splitsCreator: Address;
  tokens: Address[];
  backupWallet: Address;
  scheduledDate: bigint;
  weights: {
    roleWeight: bigint;
    thanksTokenWeight: bigint;
    thanksTokenReceivedWeight: bigint;
    thanksTokenSentWeight: bigint;
  };
  hatIds: bigint[];
  multiplierTops: bigint[];
  multiplierBottoms: bigint[];
  confirmedWearers: Address[][];
  salt: Hex;
};

/** Factory-side: create a new scheduled distributor. */
export const useScheduledDistributorFactory = () => {
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);

  const factoryAddress = useMemo(
    () => SCHEDULED_DISTRIBUTOR_FACTORY_ADDRESS as Address | undefined,
    [],
  );

  const createScheduledDistributor = useCallback(
    async (params: CreateScheduledDistributorParams) => {
      if (!wallet) {
        toast.error("Connect a wallet to schedule a distribution");
        return;
      }
      if (!factoryAddress) {
        toast.error(
          "VITE_SCHEDULED_DISTRIBUTOR_FACTORY_ADDRESS is not configured",
        );
        return;
      }
      setIsLoading(true);
      try {
        const rule = {
          // hats & scheduler are overwritten by the factory; supply zero.
          hats: "0x0000000000000000000000000000000000000000" as Address,
          splitsCreator: params.splitsCreator,
          scheduler: "0x0000000000000000000000000000000000000000" as Address,
          tokens: params.tokens,
          backupWallet: params.backupWallet,
          scheduledDate: params.scheduledDate,
          weights: params.weights,
          hatIds: params.hatIds,
          multiplierTops: params.multiplierTops,
          multiplierBottoms: params.multiplierBottoms,
          confirmedWearers: params.confirmedWearers,
        };
        const tx = await wallet.writeContract({
          address: factoryAddress,
          abi: SCHEDULED_DISTRIBUTOR_FACTORY_ABI,
          functionName: "createScheduledDistributor",
          args: [rule, params.salt],
        });
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
        });
        const events = parseEventLogs({
          abi: SCHEDULED_DISTRIBUTOR_FACTORY_ABI,
          eventName: "ScheduledDistributorCreated",
          logs: receipt.logs,
          strict: false,
        });
        const created = events[0];
        if (created) {
          toast.success("Distribution scheduled");
          return created.args.distributor as Address;
        }
        // The tx succeeded but we couldn't parse the
        // `ScheduledDistributorCreated` event — usually an ABI/factory
        // mismatch. Surface this so the user knows funds-at-rest exist
        // on-chain and the wizard can't auto-recover; the tx hash lets them
        // dig further via a block explorer.
        console.error("Missing ScheduledDistributorCreated event", {
          txHash: tx,
          logs: receipt.logs,
        });
        toast.error(
          `作成トランザクションは成功しましたが、デプロイ済みアドレスを取得できませんでした (tx: ${tx})。詳細は予約一覧から確認してください。`,
        );
      } catch (e) {
        console.error(e);
        toast.error("Failed to schedule distribution");
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, factoryAddress],
  );

  return { factoryAddress, isLoading, createScheduledDistributor };
};
