import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-viem";

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
};

export default config;
