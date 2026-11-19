import "dotenv/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import { configVariable, defineConfig } from "hardhat/config";
import { tasks } from "./tasks";

// Identical settings for every build profile: Hardhat's `production` profile
// would otherwise turn the optimizer on and change the deployed bytecode.
const compilerSettings = {
  version: "0.8.24",
  settings: {
    viaIR: true,
    optimizer: {
      enabled: false,
      runs: 200,
    },
    evmVersion: "cancun",
    // No metadata hash in the bytecode, so CREATE2 addresses (deploy:all)
    // depend only on the code and compiler settings — not on source paths,
    // comments or the build tool. Same choice as Uniswap v4, Seaport and
    // Morpho Blue.
    metadata: {
      bytecodeHash: "none",
    },
  },
};

const alchemyUrl = (subdomain: string) =>
  configVariable("ALCHEMY_API_KEY", {
    format: `https://${subdomain}.g.alchemy.com/v2/{variable}`,
  });

// With no key in the env the network has no accounts, so
// read-only tasks (getChainInfo, getWoreTime, ...) still work.
const accountsFrom = (envName: string) =>
  process.env[envName] ? [configVariable(envName)] : [];

export default defineConfig({
  plugins: [
    hardhatViem,
    hardhatEthers,
    hardhatMocha,
    hardhatNetworkHelpers,
    hardhatVerify,
  ],
  tasks,
  solidity: {
    profiles: {
      default: compilerSettings,
      production: compilerSettings,
    },
  },
  paths: {
    tests: { mocha: "test" },
  },
  networks: {
    default: {
      type: "edr-simulated",
      allowUnlimitedContractSize: true,
    },
    localhost: {
      type: "http",
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      url: alchemyUrl("eth-sepolia"),
      accounts: accountsFrom("PRIVATE_KEY"),
    },
    holesky: {
      type: "http",
      url: alchemyUrl("eth-holesky"),
      accounts: accountsFrom("PRIVATE_KEY"),
    },
    baseSepolia: {
      type: "http",
      url: alchemyUrl("base-sepolia"),
      accounts: accountsFrom("PRIVATE_KEY"),
    },
    base: {
      type: "http",
      url: alchemyUrl("base-mainnet"),
      accounts: accountsFrom("PRODUCTION_PRIVATE_KEY"),
    },
  },
  verify: {
    // Single Etherscan.io key → Etherscan API v2 (multichain: sepolia, base,
    // baseSepolia, ...).
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
    // Verify on Etherscan only.
    blockscout: { enabled: false },
    sourcify: { enabled: false },
  },
});
