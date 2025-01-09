import { type Address, decodeEventLog } from "viem";
import { publicClient, walletClient } from "..";
import { SPLITS_ABI } from "../abi/splits";
import { startLoading } from "../services/loading";

type SplitsInfo = {
  hatId: bigint;
  multiplierBottom: bigint;
  multiplierTop: bigint;
  wearers: Address[];
};

/**
 * Splitsを作成
 */
export const create = async (splitsAddress: Address, args: SplitsInfo[]) => {
  const stop = startLoading();
  const { request } = await publicClient.simulateContract({
    address: splitsAddress,
    abi: SPLITS_ABI,
    account: walletClient.account,
    functionName: "create",
    args: [args],
  });

  const hash = await walletClient.writeContract(request);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  const log = receipt.logs.find((log) => {
    try {
      const decodedLog = decodeEventLog({
        abi: SPLITS_ABI,
        data: log.data,
        topics: log.topics,
      });
      return decodedLog.eventName === "SplitsCreated";
    } catch (error) {}
  });

  stop();

  if (log) {
    const decodedLog = decodeEventLog({
      abi: SPLITS_ABI,
      data: log.data,
      topics: log.topics,
    });
    console.log(decodedLog);
    console.log(
      "Split Link:",
      `https://app.splits.org/accounts/${
        decodedLog.args.split
      }/?chainId=${String(publicClient.chain?.id)}`,
    );
  }

  return hash;
};
