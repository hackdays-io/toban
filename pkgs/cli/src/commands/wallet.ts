import { Command } from "commander";
import { sendEth } from "../modules/viem";
import { listProfiles, saveProfile, deleteProfile } from "../services/wallet";
import { walletClient } from "..";

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
	.requiredOption("--receiver <receiver>", "Receiver address")
	.requiredOption("--amount <amount>", "Amount")
	.action(async ({ receiver, amount }) => {
		await sendEth(walletClient, receiver, amount);
	});
