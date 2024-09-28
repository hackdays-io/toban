import { Command } from "commander";
import { getEthAddress, sendEth } from "../utils/viem";

export const walletProgram = new Command();

const { PRIVATE_KEY_0 } = process.env;

// ###############################################################
// CLI init setup
// ###############################################################

walletProgram
	.name("wallet")
	.description("This is a CLI function for toban project")
	.version("1.0.0");

// ###############################################################
// command setUp
// ###############################################################

// シフトデータを保持するための簡易データ
let shifts = [
	{ date: "2024-10-01", person: "Alice" },
	{ date: "2024-10-02", person: "Bob" },
];

/**
 * ETHアドレスを取得
 */
walletProgram
	.command("getEthAddress")
	.description("Send ETH")
	.action(async () => {
		console.log("Start getting the eth address");

		const ethAddress = getEthAddress(PRIVATE_KEY_0 as `0x${string}`)

		console.log("EthAddress:", ethAddress)
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

		await sendEth(PRIVATE_KEY_0 as `0x${string}`, address1)

		console.log("End send ETH")
	});

/**
 * シフトを一覧表示するコマンド
 */
walletProgram
	.command("list")
	.description("List all shifts")
	.action(() => {
		console.log("Current shifts:");
		shifts.forEach((shift, index) => {
			console.log(`${index + 1}. ${shift.date} - ${shift.person}`);
		});
	});

/**
 * 新しいシフトを追加するコマンド
 */
walletProgram
	.command("add <date> <person>")
	.description("Add a new shift")
	.action((date, person) => {
		shifts.push({ date, person });
		console.log(`Added new shift: ${date} - ${person}`);
	});

/**
 * ランダムで担当者を選ぶコマンド
 */
walletProgram
	.command("random")
	.description("Pick a random person for the shift")
	.action(() => {
		const randomIndex = Math.floor(Math.random() * shifts.length);
		console.log(
			`Selected: ${shifts[randomIndex].person} for ${shifts[randomIndex].date}`
		);
	});

/**
 * 引数を表示するだけのコマンド
 */
walletProgram
	.command("show")
	.description("Show the arguments")
	.option("-t, --text <text>", "Show all arguments")
	.action(async (options) => {
		console.log("your args:", options.text);
	});
