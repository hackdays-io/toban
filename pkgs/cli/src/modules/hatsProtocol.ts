import { HatsSubgraphClient } from "@hatsprotocol/sdk-v1-subgraph";
import { Address, getContract, PublicClient, WalletClient } from "viem";
import { base, optimism, sepolia } from "viem/chains";
import { HATS_ABI } from "../abi/hats";
import { simulateContract } from "viem/_types/actions/public/simulateContract";

// ###############################################################
// Read with subgraph
// ###############################################################

// Subgraph用のインスタンスを生成
export const hatsSubgraphClient = new HatsSubgraphClient({
	config: {
		[sepolia.id]: {
			endpoint:
				"https://api.studio.thegraph.com/query/55784/hats-v1-sepolia/version/latest",
		},
		[optimism.id]: {
			endpoint:
				"https://api.studio.thegraph.com/query/55784/hats-v1-optimism/version/latest",
		},
		[base.id]: {
			endpoint:
				"https://api.studio.thegraph.com/query/55784/hats-v1-base/version/latest",
		},
	},
});

/**
 * ツリー情報を取得するメソッド
 */
export const getTreeInfo = async (treeId: number) => {
	const tree = await hatsSubgraphClient.getTree({
		chainId: optimism.id,
		treeId: treeId,
		props: {
			hats: {
				props: {
					prettyId: true,
					status: true,
					createdAt: true,
					details: true,
					maxSupply: true,
					eligibility: true,
					imageUri: true,
					toggle: true,
					levelAtLocalTree: true,
					currentSupply: true,
				},
			},
		},
	});

	return tree;
};

/**
 * 帽子の着用者のウォレットアドレスを一覧を取得するメソッド
 */
export const getWearersInfo = async (hatId: string) => {
	// get the first 10 wearers of a given hat
	const wearers = await hatsSubgraphClient.getWearersOfHatPaginated({
		chainId: optimism.id,
		props: {},
		hatId: BigInt(hatId),
		page: 0,
		perPage: 100,
	});

	return wearers;
};

/**
 * 特定のウォレットアドレスが着用している全てのHats情報を取得するメソッド
 */
export const getWearerInfo = async (walletAddress: string) => {
	// get the wearer of a given hat
	const wearer = await hatsSubgraphClient.getWearer({
		chainId: optimism.id,
		wearerAddress: walletAddress as `0x${string}`,
		props: {
			currentHats: {
				props: {
					prettyId: true,
					status: true,
					createdAt: true,
					details: true,
					maxSupply: true,
					eligibility: true,
					toggle: true,
					mutable: true,
					imageUri: true,
					levelAtLocalTree: true,
					currentSupply: true,
				},
			},
		},
	});

	return wearer;
};

// ###############################################################
// Write with viem
// ###############################################################

const hatsContractBaseConfig = {
	address: "0x0000000000000000000000000000000000004a75" as Address,
	abi: HATS_ABI,
};

/**
 * 新規Hat作成
 */
export const createHat = async (
	publicClient: PublicClient,
	walletClient: WalletClient,
	args: {
		parentHatId: bigint;
		details?: string;
		maxSupply?: number;
		eligibility?: Address;
		toggle?: Address;
		mutable?: boolean;
		imageURI: string;
	}
) => {
	const { request } = await publicClient.simulateContract({
		...hatsContractBaseConfig,
		account: walletClient.account,
		functionName: "createHat",
		args: [
			args.parentHatId,
			args.details || "",
			args.maxSupply || 5,
			args.eligibility || "0x0000000000000000000000000000000000004a75",
			args.toggle || "0x0000000000000000000000000000000000004a75",
			args.mutable || true,
			args.imageURI,
		],
	});
	walletClient.writeContract(request);
};
