import "dotenv/config";
import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { resetContractAddressesJson } from "../../helpers/deploy/contractsJsonHelper";

task("resetContractAddressesJson", "resetContractAddressesJson").setAction(
  async (taskArgs: undefined, hre: HardhatRuntimeEnvironment) => {
    // call reset contract address json file
    resetContractAddressesJson({ network: hre.network.name });
  },
);
