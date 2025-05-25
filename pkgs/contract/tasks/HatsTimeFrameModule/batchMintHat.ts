import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";
import { formatBatchMintArgs, readCsv } from "../../helpers/util/csv";

/**
 * 【Task】call batchMintHat of HatsTimeFrameModule
 */
task("batchMintHat", "mintHat")
  .addParam("filepath", "file path of csv")
  .setAction(
    async (
      taskArgs: {
        filepath: string;
      },
      hre: HardhatRuntimeEnvironment,
    ) => {
      console.log(
        "################################### [START] ###################################",
      );

      // HatsTimeFrameModuleコントラクトのアドレスをjsonファイルから取得してくる。
      const {
        contracts: { HatsTimeFrameModule: rawModuleAddress },
      } = loadDeployedContractAddresses(hre.network.name);
      // JSON may include extra quotes, strip them
      const moduleAddress = rawModuleAddress.replace(/^"+|"+$/g, "");

      // create HatsTimeFrameModule instance
      const hatsTimeFrameModuleByBigBang = await hre.viem.getContractAt(
        "HatsTimeFrameModule",
        moduleAddress as `0x${string}`,
      );

      // read csv file
      const csvDatas = readCsv(taskArgs.filepath);
      // check CSV data
      console.log(`csvDatas: ${JSON.stringify(csvDatas, null, 2)}`);

      // format csv data to batchMintHat args
      const [hatIds, wearers, times] = formatBatchMintArgs(csvDatas);

      // call batchMintHat method with separate arguments
      const tx = await hatsTimeFrameModuleByBigBang.write.batchMintHat([
        hatIds,
        wearers,
        times,
      ]);

      console.log(`tx: ${tx}`);

      console.log(
        "################################### [END] ###################################",
      );
    },
  );
