import { Command } from "commander";
import { create } from "../modules/splits";
import { getAccount } from "../services/wallet";
import { rootProgram } from "..";
import { Address } from "viem";

export const splitsCommands = new Command();

// ###############################################################
// CLI init setup
// ###############################################################

splitsCommands
	.name("splits")
	.description("This is a CLI splits for toban project")
	.version("1.0.0");

// ###############################################################
// command setUp
// ###############################################################

/**
 * スプリットを作成
 */
splitsCommands
	.command("create")
	.description("Create Splits")
	.requiredOption(
		"-splits",
		"--splitsAddress <splitsAddress>",
		"Splits Address"
	)
	.requiredOption("-hid --hatId <hatId>", "Hat ID")
	.requiredOption(
		"-mb --multiplierBottom <multiplierBottom>",
		"Multiplier Bottom"
	)
	.requiredOption("-mt --multiplierTop <multiplierTop>", "Multiplier Top")
	.requiredOption("-w --wearers <wearers>", "Wearers")
	.action(
		async ({
			splitsAddress,
			hatId,
			multiplierBottom,
			multiplierTop,
			wearers,
		}) => {
			const hash = await create(splitsAddress, [
				{
					hatId: BigInt(hatId),
					multiplierBottom: BigInt(multiplierBottom),
					multiplierTop: BigInt(multiplierTop),
					wearers: [wearers] as Address[],
				},
			]);
			console.log("Transaction sent. Hash:", hash);
		}
	);
