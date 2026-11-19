import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { resetContractAddressesJson } from "../../helpers/deploy/contractsJsonHelper";

export default async function resetContractAddressesJsonTask(
  _taskArgs: unknown,
  hre: HardhatRuntimeEnvironment,
) {
  // `--network` selects the outputs/contracts-<network>.json file to reset.
  const { networkName } = await hre.network.getOrCreate();
  resetContractAddressesJson({ network: networkName });
}
