import { Command } from "commander";
import { getEthAddress, sendEth } from "../utils/viem";

export const walletProgram = new Command();

const { TOBAN_PRIVATE_KEY } = process.env;

walletProgram
	.name("wallet")
	.description("This is a CLI function for toban project")
	.version("1.0.0");

/**
 * ETHアドレスを取得
 */
walletProgram
	.command("getEthAddress")
	.description("Send ETH")
	.action(async () => {
		console.log("Start getting the eth address");

		const ethAddress = getEthAddress(TOBAN_PRIVATE_KEY as `0x${string}`);

		console.log("EthAddress:", ethAddress);
	});

/**
 * ETHを送信
 */
walletProgram
	.command("sendEth")
	.description("Send ETH")
	.action(async () => {
		console.log("Start send ETH");
		const address1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

		await sendEth(TOBAN_PRIVATE_KEY as `0x${string}`, address1);

		console.log("End send ETH");
	});
