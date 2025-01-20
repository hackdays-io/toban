import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { registerSubdomain } from "../../helpers/ens/function";

/**
 * 【Task】register subdomain
 */
task("registerSubdomain", "register subdomain")
  .addParam("label", "label for subdomain")
  .setAction(
    async (
      taskArgs: {
        label: string;
      },
      hre: HardhatRuntimeEnvironment,
    ) => {
      console.log(
        "################################### [START] ###################################",
      );

      // call registerSubdomain method
      await registerSubdomain(hre, taskArgs.label);

      console.log(
        "################################### [END] ###################################",
      );
    },
  );
