import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

/**
 * 【Task】call mintHat of HatsTimeFrameModule
 */
task("mintHat", "mintHat")
  .addParam("hatid", "hatid")
  .addParam("wearer", "address of wearer")
  .addOptionalParam(
    "module",
    "HatsTimeFrameModule instance address (clone). If omitted, uses the address from outputs",
  )
  .setAction(
    async (
      taskArgs: {
        hatid: bigint;
        wearer: `0x${string}`;
        module?: `0x${string}`;
      },
      hre: HardhatRuntimeEnvironment,
    ) => {
      console.log(
        "################################### [START] ###################################",
      );

      // BigBangコントラクトのアドレスをjsonファイルから取得してくる。
      const {
        contracts: { HatsTimeFrameModule },
      } = loadDeployedContractAddresses(hre.network.name);

      // create HatsTimeFrameModule instance
      const moduleAddress = (taskArgs.module ||
        HatsTimeFrameModule) as `0x${string}`;
      const hatsTimeFrameModuleByBigBang = await hre.viem.getContractAt(
        "HatsTimeFrameModule",
        moduleAddress,
      );

      // call mintHat method
      const tx = await hatsTimeFrameModuleByBigBang.write.mintHat([
        taskArgs.hatid,
        taskArgs.wearer,
        0n,
      ]);

      console.log(`tx: ${tx}`);
      console.log(`module: ${moduleAddress}`);

      console.log(
        "################################### [END] ###################################",
      );
    },
  );
