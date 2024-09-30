import { Command } from "commander";
import { getEthAddress, sendEth } from "../modules/viem";
import { listProfiles, saveProfile, deleteProfile } from "../services/wallet";

export const walletCommands = new Command();

const { TOBAN_PRIVATE_KEY } = process.env;

walletCommands
	.name("wallet")
	.description("This is a CLI function for toban project")
	.version("1.0.0");

/**
 * ウォレット一覧
 */
walletCommands
	.command("list")
	.description("show wallets")
	.action(async () => {
		listProfiles();
	});

/**
 * 新しいウォレットを追加
 */
walletCommands
	.command("add")
	.description("add a new wallet")
	.requiredOption("--privateKey <privateKey>", "Private key to be saved")
	.requiredOption("--name <name>", "Wallet name")
	.action(({ name, privateKey }) => {
		saveProfile({ name, privateKey });
	});

/**
 * ウォレットを削除
 */
walletCommands
	.command("remove")
	.description("remove a wallet")
	.requiredOption("--name <name>", "Wallet name")
	.action(({ name }) => {
		deleteProfile({ name });
	});

/**
 * ETHを送信
 */
walletCommands
	.command("sendEth")
	.description("Send ETH")
	.action(async () => {
		console.log("Start send ETH");
		const address1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

		await sendEth(TOBAN_PRIVATE_KEY as `0x${string}`, address1);

		console.log("End send ETH");
	});
