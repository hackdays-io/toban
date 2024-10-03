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
			wearer,
		}) => {
			const hash = await create(splitsAddress, [
				{
					hatId: hatId,
					multiplierBottom: multiplierBottom,
					multiplierTop: multiplierTop,
					wearers: [
						"0x777ee5eeed30c3712bee6c83260d786857d9c556" as Address,
						// "0xEef377Bdf67A227a744e386231fB3f264C158CDF",
					],
				},
			]);
			console.log("Transaction sent. Hash:", hash);
		}
	);
