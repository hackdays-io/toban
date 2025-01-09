import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

interface BigBangTaskArgs {
  owner: string;
  tophatdetails: string;
  tophatimageuri: string;
  hatterhatdetails: string;
  hatterhatimageuri: string;
}

/**
 * 【Task】execute bigbang method
 */
task("bigbang", "bigbang")
  .addParam("owner", "The address of the user who will own the topHat.")
  .addParam("tophatdetails", "The details of the topHat.")
  .addParam("tophatimageuri", "The image URI of the topHat.")
  .addParam("hatterhatdetails", "The details of the hatterHat.")
  .addParam("hatterhatimageuri", "The image URI of the hatterHat.")
  .setAction(
    async (taskArgs: BigBangTaskArgs, hre: HardhatRuntimeEnvironment) => {
      console.log(
        "################################### [START] ###################################",
      );
      const [bobWalletClient] = await hre.viem.getWalletClients();

      // BigBangコントラクトのアドレスをjsonファイルから取得してくる。
      const {
        contracts: { BigBang },
      } = loadDeployedContractAddresses(hre.network.name);

      // create BigBang instance
      const bigbang = await hre.viem.getContractAt("BigBang", BigBang);

      const address = bobWalletClient.account?.address;
      if (!address) {
        throw new Error("Wallet client account address is undefined");
      }

      // call bigbang method
      const tx = await bigbang.write.bigbang([
        address,
        taskArgs.tophatdetails,
        taskArgs.tophatimageuri,
        taskArgs.hatterhatdetails,
        taskArgs.hatterhatimageuri,
      ]);

      console.log(`tx: ${tx}`);

      console.log(
        "################################### [END] ###################################",
      );
    },
  );
