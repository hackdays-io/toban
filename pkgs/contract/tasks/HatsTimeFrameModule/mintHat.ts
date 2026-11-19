import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";
import { requireOption } from "../utils/requireOption";

/**
 * 【Task】call mintHat of HatsTimeFrameModule
 */
export default async function mintHat(
  taskArgs: {
    hatid: string;
    wearer: string;
    module: string;
  },
  hre: HardhatRuntimeEnvironment,
) {
  console.log(
    "################################### [START] ###################################",
  );

  const hatId = BigInt(requireOption(taskArgs.hatid, "hatid"));
  const wearer = requireOption(taskArgs.wearer, "wearer") as `0x${string}`;
  const { viem, networkName } = await hre.network.getOrCreate();

  // BigBangコントラクトのアドレスをjsonファイルから取得してくる。
  const {
    contracts: { HatsTimeFrameModule },
  } = loadDeployedContractAddresses(networkName);

  // create HatsTimeFrameModule instance
  const moduleAddress = (taskArgs.module ||
    HatsTimeFrameModule) as `0x${string}`;
  const hatsTimeFrameModuleByBigBang = await viem.getContractAt(
    "HatsTimeFrameModule",
    moduleAddress,
  );

  // call mintHat method
  const tx = await hatsTimeFrameModuleByBigBang.write.mintHat([
    hatId,
    wearer,
    0n,
  ]);

  console.log(`tx: ${tx}`);
  console.log(`module: ${moduleAddress}`);

  console.log(
    "################################### [END] ###################################",
  );
}
