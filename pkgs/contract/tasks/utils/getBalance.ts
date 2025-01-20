import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { formatEther } from "viem";

/**
 * 【Task】get the balance of the account
 */
task("getBalance", "getBalance").setAction(
  async (_taskArgs: Record<string, never>, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );
    const [bobWalletClient] = await hre.viem.getWalletClients();

    if (!bobWalletClient.account?.address) {
      throw new Error("Wallet client account address is undefined");
    }

    const publicClient = await hre.viem.getPublicClient();
    const bobBalance = await publicClient.getBalance({
      address: bobWalletClient.account.address,
    });

    console.log(
      `Balance of ${bobWalletClient.account.address}: ${formatEther(
        bobBalance,
      )} ETH`,
    );

    console.log(
      "################################### [END] ###################################",
    );
  },
);
