import { Command } from "commander";
import * as donenv from "dotenv";
import { getEthAddress, sendEth } from "../modules/viem";

donenv.config();

export const walletCommands = new Command();

const { TOBAN_PRIVATE_KEY } = process.env;

walletCommands
	.name("wallet")
	.description("This is a CLI function for toban project")
	.version("1.0.0");

/**
 * ETHアドレスを取得
 */
walletCommands
	.command("getEthAddress")
	.description("show wallet address")
	.action(async () => {
		console.log("Start getting the eth address");

		const ethAddress = getEthAddress(TOBAN_PRIVATE_KEY as `0x${string}`);

		console.log("EthAddress:", ethAddress);
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
