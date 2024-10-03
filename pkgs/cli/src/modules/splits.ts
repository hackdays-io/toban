import { Address } from "viem";
import { publicClient, walletClient } from "..";
import { SPLITS_ABI } from "../abi/splits";

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
	const { request } = await publicClient.simulateContract({
		address: splitsAddress,
		abi: SPLITS_ABI,
		account: walletClient.account,
		functionName: "create",
		args: [args],
	});
	const hash = await walletClient.writeContract(request);
	return hash;
};
