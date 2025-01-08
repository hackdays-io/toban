import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

/**
 * 【Task】call mintHat of HatsTimeFrameModule
 */
task("mintHat", "mintHat")
  .addParam("hatid", "hatid")
  .addParam("wearer", "address of wearer")
  .setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    // BigBangコントラクトのアドレスをjsonファイルから取得してくる。
    const {
      contracts: { HatsTimeFrameModule },
    } = loadDeployedContractAddresses(hre.network.name);

    // create HatsTimeFrameModule instance
    const hatsTimeFrameModuleByBigBang = await hre.viem.getContractAt(
      "HatsTimeFrameModule",
      HatsTimeFrameModule,
    );

    // call mintHat method
    const tx = await hatsTimeFrameModuleByBigBang.write.mintHat([
      taskArgs.hatid,
      taskArgs.wearer,
    ]);

    console.log(`tx: ${tx}`);

    console.log(
      "################################### [END] ###################################",
    );
  });
