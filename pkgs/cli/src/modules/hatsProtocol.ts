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
