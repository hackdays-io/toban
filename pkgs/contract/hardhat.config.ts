import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-viem";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";
import fs from "fs";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import path from "path";

dotenv.config();

const {
	PRIVATE_KEY,
	ETHERSCAN_API_KEY,
	ALCHEMY_API_KEY,
	COINMARKETCAP_API_KEY,
	GAS_REPORT,
} = process.env;

// タスクファイルを読み込むための設定
const SKIP_LOAD = process.env.SKIP_LOAD === "true";
if (!SKIP_LOAD) {
	const taskPaths = ["", "utils", "ens", "BigBang", "HatsTimeFrameModule"];
	taskPaths.forEach((folder) => {
		const tasksPath = path.join(__dirname, "tasks", folder);
		fs.readdirSync(tasksPath)
			.filter((_path) => _path.includes(".ts"))
			.forEach((task) => {
				require(`${tasksPath}/${task}`);
			});
	});
}

const config: HardhatUserConfig = {
	solidity: {
		compilers: [
			{
				version: "0.8.24",
				settings: {
					viaIR: true,
					optimizer: {
						runs: 200,
					},
				},
			},
		],
	},
	networks: {
		hardhat: {
			allowUnlimitedContractSize: true,
		},
		sepolia: {
			url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
			accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
		},
		holesky: {
			url: `https://eth-holesky.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
			accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
		},
	},
	etherscan: {
		apiKey: {
			sepolia: ETHERSCAN_API_KEY!,
			holesky: ETHERSCAN_API_KEY!,
		},
	},
	gasReporter: {
		enabled: true,
		currency: "USD",
		token: "ETH",
		coinmarketcap: COINMARKETCAP_API_KEY,
		gasPriceApi:
			"https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
	},
};

export default config;
