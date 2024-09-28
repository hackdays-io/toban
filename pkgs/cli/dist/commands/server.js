"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tobanProgram = void 0;
const commander_1 = require("commander");
exports.tobanProgram = new commander_1.Command();
// ###############################################################
// CLI init setup
// ###############################################################
exports.tobanProgram
    .name("toban")
    .description("This is a CLI tool for toban project")
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
exports.tobanProgram
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
exports.tobanProgram
    .command("add <date> <person>")
    .description("Add a new shift")
    .action((date, person) => {
    shifts.push({ date, person });
    console.log(`Added new shift: ${date} - ${person}`);
});
/**
 * ランダムで担当者を選ぶコマンド
 */
exports.tobanProgram
    .command("random")
    .description("Pick a random person for the shift")
    .action(() => {
    const randomIndex = Math.floor(Math.random() * shifts.length);
    console.log(`Selected: ${shifts[randomIndex].person} for ${shifts[randomIndex].date}`);
});
/**
 * 引数を表示するだけのコマンド
 */
exports.tobanProgram
    .command("show")
    .description("Show the arguments")
    .option("-t, --text <text>", "Show all arguments")
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("your args:", options.text);
}));
