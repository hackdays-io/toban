import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";
import { requireOption } from "../utils/requireOption";

/**
 * 【Task】get getWoreTime of HatsTimeFrameModule
 */
export default async function getWoreTime(
  taskArgs: {
    wearer: string;
  },
  hre: HardhatRuntimeEnvironment,
) {
  console.log(
    "################################### [START] ###################################",
  );

  const wearer = requireOption(taskArgs.wearer, "wearer") as `0x${string}`;
  const { viem, networkName } = await hre.network.getOrCreate();

  // BigBangコントラクトのアドレスをjsonファイルから取得してくる。
  const {
    contracts: { HatsTimeFrameModule },
  } = loadDeployedContractAddresses(networkName);

  // create HatsTimeFrameModule instance
  const hatsTimeFrameModuleByBigBang = await viem.getContractAt(
    "HatsTimeFrameModule",
    HatsTimeFrameModule,
  );

  // call getWoreTime method
  const woreTime = await hatsTimeFrameModuleByBigBang.read.getWoreTime([
    wearer,
    0n,
  ]);

  console.log(`woreTime: ${woreTime}`);

  console.log(
    "################################### [END] ###################################",
  );
}
