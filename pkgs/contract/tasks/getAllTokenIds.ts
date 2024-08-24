import {task} from "hardhat/config";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {loadDeployedContractAddresses} from "../helper/contractsJsonHelper";

task("getAllTokenIds", "getAllTokenIds on FractionalToken").setAction(
  async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################"
    );

    // コントラクトのアドレスを取得する
    const {
      contracts: {FractionToken},
    } = loadDeployedContractAddresses(hre.network.name);

    // コントラクトインスタンスを生成する。
    const fractionToken = await hre.ethers.getContractAt(
      "FractionToken",
      FractionToken
    );
    // get getAllTokenIds
    const allTokenIds = await fractionToken.getAllTokenIds();

    console.log("allTokenIds:", allTokenIds);

    console.log(
      "################################### [END] ###################################"
    );
  }
);
