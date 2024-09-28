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
exports.hatsCommands = void 0;
const commander_1 = require("commander");
const chains_1 = require("viem/chains");
const hatsProtocol_1 = require("../modules/hatsProtocol");
exports.hatsCommands = new commander_1.Command();
// ###############################################################
// CLI init setup
// ###############################################################
exports.hatsCommands
    .name("hats")
    .description("This is a CLI hats for toban project")
    .version("1.0.0");
// ###############################################################
// command setUp
// ###############################################################
/**
 * ツリーIDに紐づく全てのHatsを表示するコマンド
 */
exports.hatsCommands
    .command("list")
    .description("Show all of the Hats that are associated with the tree ID")
    .option("-id, --treeId <treeId>", "Tree ID")
    .action((options) => __awaiter(void 0, void 0, void 0, function* () {
    // ツリー情報を全て取得する。
    const tree = yield hatsProtocol_1.hatsSubgraphClient.getTree({
        chainId: chains_1.optimism.id,
        treeId: Number(options.treeId),
        props: {
            hats: {
                props: {
                    prettyId: true,
                    status: true,
                    createdAt: true,
                    details: true,
                    maxSupply: true,
                    eligibility: true,
                    imageUri: true,
                    toggle: true,
                    levelAtLocalTree: true,
                    currentSupply: true,
                },
            },
        },
    });
    console.log(tree);
}));
