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
	.requiredOption("-splits, --splitsAddress <splitsAddress>", "Splits Address")
	.requiredOption(
		"-hid, --hatId <hatId>",
		"Hat ID",
		(value, previous: string[]) =>
			previous ? previous.concat([value]) : [value],
		[]
	)
	.requiredOption(
		"-mb, --multiplierBottom <multiplierBottom>",
		"Multiplier Bottom",
		(value, previous: string[]) =>
			previous ? previous.concat([value]) : [value],
		[]
	)
	.requiredOption(
		"-mt, --multiplierTop <multiplierTop>",
		"Multiplier Top",
		(value, previous: string[]) =>
			previous ? previous.concat([value]) : [value],
		[]
	)
	.requiredOption(
		"-w, --wearers <wearers>",
		"Wearers (comma-separated addresses)",
		(value: string, previous: Address[][]) => {
			const addresses = value
				.split(",")
				.map((addr: string) => addr.trim() as Address);
			return previous ? [...previous, addresses] : [addresses];
		},
		[]
	)
	.action(
		async ({
			splitsAddress,
			hatId,
			multiplierBottom,
			multiplierTop,
			wearers,
		}) => {
			const splitsData = hatId.map((id: string, index: number) => ({
				hatId: BigInt(id),
				multiplierBottom: BigInt(multiplierBottom[index]),
				multiplierTop: BigInt(multiplierTop[index]),
				wearers: wearers[index],
			}));

			const hash = await create(splitsAddress, splitsData);
			console.log("Transaction Hash:", hash);
		}
	);
