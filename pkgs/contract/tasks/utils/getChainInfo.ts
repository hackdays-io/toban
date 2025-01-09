import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { formatEther } from "viem";

/**
 * 【Task】	getChainInfo of connected chain
 */
task("getChainInfo", "getChainInfo of connected chain").setAction(
  async (_taskArgs: Record<string, never>, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const publicClient = await hre.viem.getPublicClient();
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
  },
);
