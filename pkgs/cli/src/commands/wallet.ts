import { Command } from "commander";
import { getPublicClient, sendEth } from "../modules/viem";
import {
	getWallet,
	listProfiles,
	saveProfile,
	deleteProfile,
} from "../services/wallet";
import { mintHat } from "../modules/hatsProtocol";

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
	.requiredOption("--name <name>", "Wallet name")
	.requiredOption("--receiver <receiver>", "Receiver address")
	.requiredOption("--amount <amount>", "Amount")
	.option("--chainId <chainId>", "chainId")
	.action(async ({ name, receiver, amount, chainId }) => {
		const wallet = await getWallet(name, chainId);
		await sendEth(wallet, receiver, amount);
	});

/**
 * ロールを付与
 */
walletCommands
	.command("mintHat")
	.description("Mint Hat")
	.requiredOption("--name <name>", "Wallet name")
	.requiredOption("--hatId <hatId>", "Hat ID")
	.requiredOption("--wearer <wearer>", "Wearer address")
	.option("--chainId <chainId>", "chainId")
	.action(async ({ name, hatId, wearer, chainId }) => {
		const publicClient = await getPublicClient(chainId);
		const wallet = await getWallet(name, chainId);
		await mintHat(publicClient, wallet, { hatId, wearer });
	});
