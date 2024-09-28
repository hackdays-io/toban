import { Command } from "commander";
import {
	getTreeInfo,
	getWearerInfo,
	getWearersInfo,
} from "../modules/hatsProtocol";

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
		const tree = await getTreeInfo(Number(options.treeId));

		console.log(tree);
	});

/**
 * HatIdに紐づく着用者の情報を表示するコマンド
 */
hatsCommands
	.command("wears")
	.description("Show all of the wears that are associated with the hat ID")
	.option("-id, --hatId <hatId>", "Hat ID")
	.action(async (options) => {
		// ツリー情報を全て取得する。
		const wearers = await getWearersInfo(options.hatId);

		console.log(wearers);
	});

/**
 * ウォレットアドレスに紐づくhatの情報を取得するコマンド
 */
hatsCommands
	.command("wear")
	.description("Show all of the hat info that are associated with the hat ID")
	.option("-addr, --address <address>", "Wallet Address")
	.action(async (options) => {
		// 特定のウォレットアドレスに紐づく情報を全て取得する。
		const wearer = await getWearerInfo(options.address);

		console.log(wearer);
	});
