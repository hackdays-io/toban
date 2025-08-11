import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

/**
 * 【Task】check BigBang contract owner
 */
task("checkBigBangOwner", "Check BigBang contract owner").setAction(
  async (taskArgs: Record<string, never>, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    // BigBangコントラクトのアドレスをjsonファイルから取得してくる。
    const {
      contracts: { BigBang },
    } = loadDeployedContractAddresses(hre.network.name);

    // create BigBang instance
    const bigBang = await hre.viem.getContractAt("BigBang", BigBang);

    // Get the owner
    const owner = await bigBang.read.owner();
    console.log(`BigBang contract owner: ${owner}`);

    // Get current wallet address
    const [walletClient] = await hre.viem.getWalletClients();
    const currentAddress = walletClient.account?.address;
    console.log(`Current wallet address: ${currentAddress}`);

    console.log(
      `Is current wallet the owner: ${owner.toLowerCase() === currentAddress?.toLowerCase()}`,
    );

    console.log(
      "################################### [END] ###################################",
    );
  },
);
