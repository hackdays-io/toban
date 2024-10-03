import { Command } from "commander";
import {
	getTreeInfo,
	getWearerInfo,
	getWearersInfo,
	createHat,
	mintHat,
} from "../modules/hatsProtocol";
import { getAccount } from "../services/wallet";
import { publicClient, rootProgram, walletClient } from "..";
import { Address } from "viem";

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
		const tree = await getTreeInfo(Number(options.treeId), options.chainId);

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
		const wearers = await getWearersInfo(options.hatId, options.chainId);

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
		const address =
			options.address || getAccount(rootProgram.opts().profile).address;
		const wearer = await getWearerInfo(address, rootProgram.opts().chain);

		console.log(wearer);
	});

/**
 * ロールを作成
 */
hatsCommands
	.command("createHat")
	.description("Create Hat")
	.requiredOption("-hid", "--hatId <hatId>", "Hat ID")
	.requiredOption("-img", "--imageUri <imageURI>", "Image URI")
	.option("-det", "--details <details>", "Details")
	.option("-max", "--maxSupply <maxSupply>", "Max Supply")
	.option("-el", "--eligibility <eligibility>", "Eligibility Address")
	.option("-tgl", "--toggle <toggle>", "Toggle")
	.option("-mut", "--mutable <mutable>", "Mutable")
	.action(
		async ({
			hatId,
			details,
			maxSupply,
			eligibility,
			toggle,
			mutable,
			imageURI,
		}) => {
			await createHat({
				parentHatId: BigInt(hatId),
				details,
				maxSupply,
				eligibility: eligibility as Address,
				toggle: toggle as Address,
				mutable: mutable,
				imageURI,
			});
		}
	);

/**
 * ロールを付与
 */
hatsCommands
	.command("mintHat")
	.description("Mint Hat")
	.requiredOption("-hid", "--hatId <hatId>", "Hat ID")
	.requiredOption("--wearer <wearer>", "Wearer address")
	.action(async ({ hatId, wearer }) => {
		await mintHat({ hatId, wearer });
	});
