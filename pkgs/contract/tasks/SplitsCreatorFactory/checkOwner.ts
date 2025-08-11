import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

/**
 * 【Task】Check SplitsCreatorFactory owner and permissions
 */
task(
  "checkSplitsCreatorFactoryOwner",
  "Check SplitsCreatorFactory owner and permissions",
).setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
  console.log(
    "################################### [START] ###################################",
  );

  const [deployer] = await hre.viem.getWalletClients();
  const network = hre.network.name;

  console.log(`Checking SplitsCreatorFactory owner on ${network} network`);
  console.log(`Current wallet address: ${deployer.account?.address}`);

  const { contracts } = loadDeployedContractAddresses(network);

  console.log("Contract addresses:");
  console.log("SplitsCreatorFactory:", contracts.SplitsCreatorFactory);

  // SplitsCreatorFactoryコントラクトのインスタンスを取得
  const splitsCreatorFactory = await hre.viem.getContractAt(
    "SplitsCreatorFactory",
    contracts.SplitsCreatorFactory,
  );

  try {
    // ownerを確認
    const owner = await splitsCreatorFactory.read.owner();
    console.log("SplitsCreatorFactory owner:", owner);

    const isOwner =
      owner.toLowerCase() === deployer.account?.address?.toLowerCase();
    console.log("Current wallet is owner:", isOwner);

    // BIG_BANGアドレスも確認
    const currentBigBang = await splitsCreatorFactory.read.BIG_BANG();
    console.log("Current BIG_BANG:", currentBigBang);

    if (!isOwner) {
      console.log(
        "❌ ERROR: Current wallet is not the owner of SplitsCreatorFactory!",
      );
      console.log("Only the owner can call setBigBang function.");
    } else {
      console.log(
        "✅ Current wallet has permission to modify SplitsCreatorFactory.",
      );
    }
  } catch (error) {
    console.error("Error checking owner:", error);
  }

  console.log(
    "################################### [END] ###################################",
  );
});
