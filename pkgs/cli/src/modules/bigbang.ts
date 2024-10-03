// ###############################################################
// Write with viem
// ###############################################################

import { Address, decodeEventLog } from "viem";
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
	})!;

	stop();

	console.log(
		decodeEventLog({
			abi: bigbangContractBaseConfig.abi,
			data: log.data,
			topics: log.topics,
		})
	);

	return transactionHash;
};
