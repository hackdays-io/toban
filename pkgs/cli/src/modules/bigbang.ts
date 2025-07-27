// ###############################################################
// Write with viem
// ###############################################################

import { hatIdToTreeId } from "@hatsprotocol/sdk-v1-core";
import { type Address, decodeEventLog } from "viem";
import { publicClient, walletClient } from "..";
import { bigbangContractBaseConfig } from "../config";
import { startLoading } from "../services/loading";

/**
 * プロジェクト作成
 */

export const bigbang = async (params: {
  owner: Address;
  topHatDetails: string;
  topHatImageURI: string;
  hatterHatDetails: string;
  hatterHatImageURI: string;
  memberHatDetails: string;
  memberHatImageURI: string;
  trustedForwarder: Address;
}) => {
  const stop = startLoading();

  const { request } = await publicClient.simulateContract({
    ...bigbangContractBaseConfig,
    account: walletClient.account,
    functionName: "bigbang",
    args: [
      params.owner,
      params.topHatDetails,
      params.topHatImageURI,
      params.hatterHatDetails,
      params.hatterHatImageURI,
      params.memberHatDetails,
      params.memberHatImageURI,
      params.trustedForwarder,
    ],
  });
  const transactionHash = await walletClient.writeContract(request);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: transactionHash,
  });

  const log = receipt.logs.find((log) => {
    try {
      const decodedLog = decodeEventLog({
        abi: bigbangContractBaseConfig.abi,
        data: log.data,
        topics: log.topics,
      });
      return decodedLog.eventName === "Executed";
    } catch (error) {}
  });

  stop();

  if (log) {
    const decodedLog = decodeEventLog({
      abi: bigbangContractBaseConfig.abi,
      data: log.data,
      topics: log.topics,
    });
    console.log(decodedLog);
    console.log(
      "Tree Link:",
      `https://app.hatsprotocol.xyz/trees/${String(
        publicClient.chain?.id,
      )}/${hatIdToTreeId(BigInt(decodedLog.args.topHatId))}`,
    );
  }

  return transactionHash;
};
