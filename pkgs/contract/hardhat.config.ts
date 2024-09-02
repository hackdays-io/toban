import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-viem";
import * as dotenv from "dotenv";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const { GAS_REPORT, COINMARKETCAP_API_KEY } = process.env;

const config: HardhatUserConfig = {
	solidity: {
		compilers: [
			{
				version: "0.8.24",
				settings: {
					viaIR: true,
				},
			},
		],
	},
	networks: {
		hardhat: {
			allowUnlimitedContractSize: true,
		},
	},
	gasReporter: {
		enabled: GAS_REPORT ? true : false,
		currency: "JPY",
		gasPrice: 20,
		token: "ETH",
		coinmarketcap: COINMARKETCAP_API_KEY,
		gasPriceApi:
			"https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
	},
};

export default config;
