import { type Address, decodeEventLog } from "viem";
import { publicClient, walletClient } from "..";
import { fractionTokenBaseConfig } from "../config";
import { startLoading } from "../services/loading";

export const getTokenId = async (hatId: bigint, account: Address) => {
  const res = await publicClient.readContract({
    ...fractionTokenBaseConfig,
    functionName: "getTokenId",
    args: [hatId, account],
  });

  return res;
};

export const mintFractionToken = async (hatId: bigint, account: Address) => {
  const { request } = await publicClient.simulateContract({
    ...fractionTokenBaseConfig,
    account: walletClient.account,
    functionName: "mint",
    args: [hatId, account],
  });
  const transactionHash = await walletClient.writeContract(request);

  return transactionHash;
};

export const sendFractionToken = async (
  to: Address,
  hatId: bigint,
  amount: bigint,
) => {
  const stop = startLoading();
  const tokenId = await getTokenId(hatId, walletClient.account?.address!);

  const { request } = await publicClient.simulateContract({
    ...fractionTokenBaseConfig,
    account: walletClient.account,
    functionName: "safeTransferFrom",
    args: [walletClient.account?.address!, to, tokenId, amount, "" as any],
  });
  const transactionHash = await walletClient.writeContract(request);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
  });

  const log = receipt.logs.find((log) => {
    const decodedLog = decodeEventLog({
      abi: fractionTokenBaseConfig.abi,
      data: log.data,
      topics: log.topics,
    });
    return decodedLog.eventName === "TransferSingle";
  });

  stop();

  if (log) {
    console.log(
      decodeEventLog({
        abi: fractionTokenBaseConfig.abi,
        data: log!.data,
        topics: log!.topics,
      }),
    );
  }

  return transactionHash;
};
