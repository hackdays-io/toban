import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

interface BigBangTaskArgs {
  owner: string;
  tophatdetails: string;
  tophatimageuri: string;
  hatterhatdetails: string;
  hatterhatimageuri: string;
  memberhatdetails: string;
  memberhatimageuri: string;
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
  .addParam("memberhatdetails", "The details of the memberHat.")
  .addParam("memberhatimageuri", "The image URI of the memberHat.")
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

      console.log("Calling bigbang with parameters:");
      console.log(`  owner: ${taskArgs.owner}`);
      console.log(`  tophatdetails: ${taskArgs.tophatdetails}`);
      console.log(`  tophatimageuri: ${taskArgs.tophatimageuri}`);
      console.log(`  hatterhatdetails: ${taskArgs.hatterhatdetails}`);
      console.log(`  hatterhatimageuri: ${taskArgs.hatterhatimageuri}`);
      console.log(`  memberhatdetails: ${taskArgs.memberhatdetails}`);
      console.log(`  memberhatimageuri: ${taskArgs.memberhatimageuri}`);

      try {
        // call bigbang method with explicit gas limit
        const tx = await bigbang.write.bigbang(
          [
            taskArgs.owner as `0x${string}`,
            taskArgs.tophatdetails,
            taskArgs.tophatimageuri,
            taskArgs.hatterhatdetails,
            taskArgs.hatterhatimageuri,
            taskArgs.memberhatdetails,
            taskArgs.memberhatimageuri,
          ],
          {
            gas: 9000000n, // 9M gas limit
          },
        );

        console.log(`Transaction hash: ${tx}`);
        console.log("BigBang executed successfully!");
      } catch (error) {
        console.error("An unexpected error occurred:");
        console.error(error);
        throw error;
      }

      console.log(
        "################################### [END] ###################################",
      );
    },
  );
