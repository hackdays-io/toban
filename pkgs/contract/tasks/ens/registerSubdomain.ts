import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";
import { registerSubdomain } from "../../helpers/ens/function";
import { requireOption } from "../utils/requireOption";

/**
 * 【Task】register subdomain
 */
export default async function registerSubdomainTask(
  taskArgs: {
    label: string;
  },
  hre: HardhatRuntimeEnvironment,
) {
  console.log(
    "################################### [START] ###################################",
  );

  const label = requireOption(taskArgs.label, "label");
  const { viem } = await hre.network.getOrCreate();

  // call registerSubdomain method
  await registerSubdomain(viem, label);

  console.log(
    "################################### [END] ###################################",
  );
}
