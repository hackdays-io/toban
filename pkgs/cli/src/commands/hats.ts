import { Command } from "commander";
import { optimism } from "viem/chains";
import { hatsSubgraphClient } from "../modules/hatsProtocol";

export const hatsCommands = new Command();

// ###############################################################
// CLI init setup
// ###############################################################

hatsCommands
	.name("hats")
	.description("This is a CLI hats for toban project")
	.version("1.0.0");

// ###############################################################
// command setUp
// ###############################################################

/**
 * ツリーIDに紐づく全てのHatsを表示するコマンド
 */
hatsCommands
	.command("list")
	.description("Show all of the Hats that are associated with the tree ID")
	.option("-id, --treeId <treeId>", "Tree ID")
	.action(async (options) => {
		// ツリー情報を全て取得する。
		const tree = await hatsSubgraphClient.getTree({
			chainId: optimism.id,
			treeId: Number(options.treeId),
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

		console.log(tree);
	});
