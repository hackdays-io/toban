import { Command } from "commander";
import { getEthAddress, sendEth } from "../modules/viem";
import { getWallet, listProfiles, saveProfile } from "../services/wallet";

export const walletCommands = new Command();

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
 * ETHを送信
 */
walletCommands
	.command("sendEth")
	.description("Send ETH")
	.requiredOption("--name <name>", "Wallet name")
	.requiredOption("--receiver <receiver>", "Receiver address")
	.requiredOption("--amount <amount>", "Amount")
	.option("--chainId <chainId>", "chainId")
	.action(async ({ name, receiver, amount, chainId }) => {
		const account = getWallet(name);
		await sendEth(account, receiver, amount, chainId);
	});
