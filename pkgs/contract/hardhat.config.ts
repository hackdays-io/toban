import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          viaIR: true,
        },
      },
    ]
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    }
  }
};

export default config;
