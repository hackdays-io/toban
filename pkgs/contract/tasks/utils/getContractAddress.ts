import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { getContractAddress } from "../../helpers/deploy/contractJsonIgnitionHelper";
import { requireOption } from "./requireOption";

interface GetContractAddressTaskArgs {
  contract: string;
}

/**
 * 【Task】	get deployed contract address
 */
export default async function getContractAddressTask(
  taskArgs: GetContractAddressTaskArgs,
  hre: HardhatRuntimeEnvironment,
) {
  console.log(
    "################################### [START] ###################################",
  );

  const contract = requireOption(taskArgs.contract, "contract");
  const { viem } = await hre.network.getOrCreate();
  const publicClient = await viem.getPublicClient();
  const chainId = (await publicClient.getChainId()).toString();
  // get contract name
  const contractName = `${contract}Module#${contract}`;

  // get contract address
  const contractAddress = getContractAddress(chainId, contractName);

  console.log(`
      ${contractName} 's address is ${contractAddress}
    `);

  console.log(
    "################################### [END] ###################################",
  );
}
