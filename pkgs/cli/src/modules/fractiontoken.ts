import { Address } from "viem";
import { publicClient, walletClient } from "..";
import { fractionTokenBaseConfig } from "../config";

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
	amount: bigint
) => {
	const tokenId = await getTokenId(hatId, walletClient.account?.address!);

	const { request } = await publicClient.simulateContract({
		...fractionTokenBaseConfig,
		account: walletClient.account,
		functionName: "safeTransferFrom",
		args: [walletClient.account?.address!, to, tokenId, amount, "" as any],
	});
	const transactionHash = await walletClient.writeContract(request);

	return transactionHash;
};
