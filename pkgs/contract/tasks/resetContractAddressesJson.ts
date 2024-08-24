import "dotenv/config";
import {task} from "hardhat/config";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {resetContractAddressesJson} from "../helper/contractsJsonHelper";

task("resetContractAddressesJson", "resetContractAddressesJson").setAction(
  async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    // call reset contract address json file
    resetContractAddressesJson({network: hre.network.name});
  }
);
