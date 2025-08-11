import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

/**
 * 【Task】Check BigBang address setting in SplitsCreatorFactory
 */
task(
  "checkBigBangSetting",
  "Check if BigBang address is correctly set in SplitsCreatorFactory",
).setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
  console.log(
    "################################### [START] ###################################",
  );

  const network = hre.network.name;
  console.log(`Checking BigBang settings on ${network} network`);

  const { contracts } = loadDeployedContractAddresses(network);

  console.log("Contract addresses:");
  console.log("BigBang:", contracts.BigBang);
  console.log("SplitsCreatorFactory:", contracts.SplitsCreatorFactory);

  // SplitsCreatorFactoryのBIG_BANGアドレスを確認
  const splitsCreatorFactory = await hre.viem.getContractAt(
    "SplitsCreatorFactory",
    contracts.SplitsCreatorFactory,
  );

  // SplitsCreatorFactoryコントラクトと紐づいているBigBangアドレスを取得
  const currentBigBang = await splitsCreatorFactory.read.BIG_BANG();
  console.log("Current BIG_BANG in SplitsCreatorFactory:", currentBigBang);
  console.log("Expected BigBang address:", contracts.BigBang);

  const addressesMatch =
    currentBigBang.toLowerCase() === contracts.BigBang.toLowerCase();
  console.log("Addresses match:", addressesMatch);

  if (!addressesMatch) {
    console.log("❌ ERROR: BigBang address mismatch!");
    console.log(
      "This is likely the cause of the 'Only BigBang can call this function' error.",
    );
    console.log("Please run 'setBigBang' task to fix this issue.");
  } else {
    console.log("✅ BigBang address is correctly set.");
  }

  console.log(
    "################################### [END] ###################################",
  );
});
