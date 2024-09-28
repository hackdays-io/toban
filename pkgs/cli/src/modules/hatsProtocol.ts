import { HatsSubgraphClient } from "@hatsprotocol/sdk-v1-subgraph";
import { optimism, sepolia } from "viem/chains";

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
