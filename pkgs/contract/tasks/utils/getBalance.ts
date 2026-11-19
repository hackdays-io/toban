import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { formatEther } from "viem";

/**
 * 【Task】get the balance of the account
 */
export default async function getBalance(
  _taskArgs: unknown,
  hre: HardhatRuntimeEnvironment,
) {
  console.log(
    "################################### [START] ###################################",
  );
  const { viem } = await hre.network.getOrCreate();
  const [bobWalletClient] = await viem.getWalletClients();

  if (!bobWalletClient.account?.address) {
    throw new Error("Wallet client account address is undefined");
  }

  const publicClient = await viem.getPublicClient();
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
}
