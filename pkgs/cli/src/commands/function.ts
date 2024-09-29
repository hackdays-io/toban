import { Command } from "commander";

export const functionCommands = new Command();

// ###############################################################
// CLI init setup
// ###############################################################

functionCommands
	.name("function")
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
 * シフトを一覧表示するコマンド
 */
functionCommands
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
functionCommands
	.command("add <date> <person>")
	.description("Add a new shift")
	.action((date, person) => {
		shifts.push({ date, person });
		console.log(`Added new shift: ${date} - ${person}`);
	});

/**
 * ランダムで担当者を選ぶコマンド
 */
functionCommands
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
functionCommands
	.command("show")
	.description("Show the arguments")
	.option("-t, --text <text>", "Show all arguments")
	.action(async (options) => {
		console.log("your args:", options.text);
	});
