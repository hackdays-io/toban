import { HatsSubgraphClient } from "@hatsprotocol/sdk-v1-subgraph";
import { Address } from "viem";
import { base, optimism, sepolia } from "viem/chains";
import {
	hatsContractBaseConfig,
	hatsTimeFrameContractBaseConfig,
} from "../config";
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
		address: "0x39cB5bb4D84a37d1d9D0Abb0c9a6C5F5DE501aba" as Address,
		abi: SPLITS_ABI,
		account: walletClient.account,
		functionName: "create",
		args: [args],
	});
	const hash = await walletClient.writeContract(request);
	return hash;
};
