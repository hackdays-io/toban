// ###############################################################
// Write with viem
// ###############################################################

import { Address } from "viem";
import { publicClient, walletClient } from "..";
import { bigbangContractBaseConfig } from "../config";

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

	return transactionHash;
};
