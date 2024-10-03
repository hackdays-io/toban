import { Command } from "commander";
import {
	getTreeInfo,
	getWearerInfo,
	getWearersInfo,
} from "../modules/hatsProtocol";
import { PinataSDK } from "pinata-web3";
import { getJwt, setJwt } from "../services/hats";

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

/**
 * PinataのJWTを設定するコマンド
 */
hatsCommands
	.command("pinata")
	.description("Set a jwt of Pinata")
	.requiredOption("--jwt <JWT>")
	.action(({ jwt }) => {
		setJwt(jwt);
	});

/**
 * Hatのメタデータをipfs上にアップロードするコマンド
 */
interface Responsibility {
	label: string;
	description?: string;
	link?: string;
}
interface Eligibility {
	manual: boolean;
	criteria: string[];
}
interface Toggle {
	manual: boolean;
	criteria: string[];
}
hatsCommands
	.command("upload")
	.description("Upload the hat metadata on ipfs.")
	.requiredOption("-n, --name <name>", "Hat Name")
	.option("-d, --description <description>", "Hat Details")
	.option(
		"-r, --responsibility <label>,<description>,<link>",
		"Responsibility (may be specified multiple times to define multiple responsibilities)",
		(value, previous: Responsibility[]) => {
			const [label, description, link] = value.split(",");
			return previous ? previous.concat([{ label, description, link }]) : [{ label, description, link }];
		},
		[]
	)
	.option(
		"-a, --authority <authority>",
		"Authority (may be specified multiple times to define multiple authorities)",
		(value, previous: string[]) => previous ? previous.concat([value]) : [value],
		[]
	)
	.option(
		"-e, --eligibility <manual>,<criteria...>",
		"Eligibility (<manual> is a boolean value, <criteria... > can be specified multiple times, separated by commas, to define multiple criteria.)",
		(value) => {
			const [manual, ...criteria] = value.split(",");
			return { manual: manual === "true", criteria } satisfies Eligibility;
		}
	)
	.option(
		"-t, --toggle <manual> <criteria...>",
		"Toggle (<manual> is a boolean value, <criteria... > can be specified multiple times, separated by spaces, to define multiple criteria.)",
		(value) => {
			const [manual, ...criteria] = value.split(",");
			return { manual: manual === "true", criteria } satisfies Toggle;
		}
	)
	.action(async ({
		name,
		description,
		responsibility,
		authority,
		eligibility,
		toggle,
	}) => {
		const { jwt } = getJwt();
	
		const pinata = new PinataSDK({ pinataJwt: jwt });

		const upload = await pinata.upload.json({
			"type": "1.0",
			"data": {
				name,
				description,
				responsibilities: responsibility,
				authorities: authority,
				eligibility,
				toggle
			}
		});

		console.log("CID:", upload.IpfsHash);
	});