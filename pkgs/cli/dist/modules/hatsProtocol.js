"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hatsSubgraphClient = void 0;
const sdk_v1_subgraph_1 = require("@hatsprotocol/sdk-v1-subgraph");
const chains_1 = require("viem/chains");
// Subgraph用のインスタンスを生成
exports.hatsSubgraphClient = new sdk_v1_subgraph_1.HatsSubgraphClient({
    config: {
        [chains_1.sepolia.id]: {
            endpoint: "https://api.studio.thegraph.com/query/55784/hats-v1-sepolia/version/latest",
        },
        [chains_1.optimism.id]: {
            endpoint: "https://api.studio.thegraph.com/query/55784/hats-v1-optimism/version/latest",
        },
    },
});
