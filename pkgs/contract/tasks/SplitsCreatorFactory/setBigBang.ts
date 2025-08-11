import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

/**
 * 【Task】Set BigBang address in SplitsCreatorFactory
 */
task("setBigBang", "Set BigBang address in SplitsCreatorFactory").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const [deployer] = await hre.viem.getWalletClients();
    const network = hre.network.name;

    console.log(`Setting BigBang address on ${network} network`);
    console.log(`Deployer address: ${deployer.account?.address}`);

    const { contracts } = loadDeployedContractAddresses(network);

    console.log("Contract addresses:");
    console.log("BigBang:", contracts.BigBang);
    console.log("SplitsCreatorFactory:", contracts.SplitsCreatorFactory);

    // SplitsCreatorFactoryコントラクトのインスタンスを取得
    const splitsCreatorFactory = await hre.viem.getContractAt(
      "SplitsCreatorFactory",
      contracts.SplitsCreatorFactory,
    );

    // 現在のBIG_BANGアドレスを確認
    const currentBigBang = await splitsCreatorFactory.read.BIG_BANG();
    console.log("Current BIG_BANG in SplitsCreatorFactory:", currentBigBang);

    if (currentBigBang.toLowerCase() === contracts.BigBang.toLowerCase()) {
      console.log("✅ BigBang address is already correctly set.");
      console.log(
        "################################### [END] ###################################",
      );
      return;
    }

    console.log("Setting BigBang address...");

    // BigBangアドレスを設定
    const tx = await splitsCreatorFactory.write.setBigBang([contracts.BigBang]);

    console.log(`Transaction hash: ${tx}`);
    console.log("✅ BigBang address has been set successfully.");

    // 設定後の確認
    const newBigBang = await splitsCreatorFactory.read.BIG_BANG();
    console.log("New BIG_BANG in SplitsCreatorFactory:", newBigBang);

    console.log(
      "################################### [END] ###################################",
    );
  },
);
