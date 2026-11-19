import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { formatEther } from "viem";

/**
 * 【Task】	getChainInfo of connected chain
 */
export default async function getChainInfo(
  _taskArgs: unknown,
  hre: HardhatRuntimeEnvironment,
) {
  console.log(
    "################################### [START] ###################################",
  );

  const { viem } = await hre.network.getOrCreate();
  const publicClient = await viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const blockNumber = await publicClient.getBlockNumber();
  const count = await publicClient.getBlockTransactionCount();
  const gasPrice = await publicClient.getGasPrice();
  const gasPriceInEther = formatEther(gasPrice);

  console.log(`
      Chain ID: ${chainId}
      Block Number: ${blockNumber}
      Transaction Count: ${count}
      Gas Price: ${gasPriceInEther} ETH
    `);

  console.log(
    "################################### [END] ###################################",
  );
}
