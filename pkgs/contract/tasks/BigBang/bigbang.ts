import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEventLogs } from "viem";
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
            gas: 15000000n, // 15M gas limit - much higher
          },
        );

        console.log(`Transaction hash: ${tx}`);
        console.log("Waiting for transaction confirmation...");

        // Get transaction receipt
        const publicClient = await hre.viem.getPublicClient();
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: tx,
          confirmations: 1,
        });

        console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed}`);
        console.log(`Status: ${receipt.status}`);

        // Check if transaction was successful
        if (receipt.status === "reverted") {
          console.log("❌ Transaction was reverted!");
          throw new Error("Transaction reverted");
        }

        console.log("✅ Transaction successful!");
        // Decode Executed straight from the contract's artifact ABI so this
        // task never drifts when the event signature changes (e.g. the
        // questAgentHatId field added in #531).
        const executedEvents = parseEventLogs({
          abi: bigbang.abi,
          eventName: "Executed",
          logs: receipt.logs,
        });

        if (executedEvents.length > 0) {
          console.log("\n=== BigBang Execution Results ===");
          const event = executedEvents[0];
          console.log(`Creator: ${event.args.creator}`);
          console.log(`Owner: ${event.args.owner}`);
          console.log(`TopHat ID: ${event.args.topHatId}`);
          console.log(`HatterHat ID: ${event.args.hatterHatId}`);
          console.log(`MemberHat ID: ${event.args.memberHatId}`);
          console.log(`OperatorHat ID: ${event.args.operatorHatId}`);
          console.log(`CreatorHat ID: ${event.args.creatorHatId}`);
          console.log(`MinterHat ID: ${event.args.minterHatId}`);
          console.log(`QuestAgentHat ID: ${event.args.questAgentHatId}`);
          console.log(`HatsTimeFrameModule: ${event.args.hatsTimeFrameModule}`);
          console.log(
            `HatsHatCreatorModule: ${event.args.hatsHatCreatorModule}`,
          );
          console.log(
            `HatsFractionTokenModule: ${event.args.hatsFractionTokenModule}`,
          );
          console.log(`SplitCreator: ${event.args.splitCreator}`);
          console.log(`ThanksToken: ${event.args.thanksToken}`);

          // Save important IDs for future reference
          console.log("\n=== For batchMintHat Testing ===");
          console.log(`Use MinterHat ID: ${event.args.minterHatId}`);
          console.log(`Target MemberHat ID: ${event.args.memberHatId}`);
          console.log(
            `HatsTimeFrameModule Address: ${event.args.hatsTimeFrameModule}`,
          );
        }

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
