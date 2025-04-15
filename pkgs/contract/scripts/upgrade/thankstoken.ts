import { ethers } from "hardhat";
import { deployCreate2Deployer } from "../../helpers/deploy/Create2Factory";
import {
  getContractFromJsonFile,
  writeContractAddressToJsonFile,
} from "../../helpers/deploy/contractsJsonHelper";
import { upgradeThanksToken } from "../../helpers/upgrade/thankstoken";

/**
 * Upgrade ThanksToken implementation
 */
async function main() {
  const { Create2Deployer } = await deployCreate2Deployer();
  const create2Address = Create2Deployer.address;

  // Get the ThanksToken proxy address from contracts.json
  const thanksTokenAddress = await getContractFromJsonFile("ThanksToken");
  if (!thanksTokenAddress) {
    throw new Error("ThanksToken address not found in contracts.json");
  }

  console.log("Upgrading ThanksToken at address:", thanksTokenAddress);

  const { UpgradedThanksToken, UpgradedThanksTokenImplAddress } =
    await upgradeThanksToken(
      thanksTokenAddress,
      "ThanksToken", // Implementation contract name
      create2Address,
    );

  console.log("ThanksToken upgraded");
  console.log("New implementation address:", UpgradedThanksTokenImplAddress);

  // Save the new implementation address
  await writeContractAddressToJsonFile(
    "ThanksToken_Implementation",
    UpgradedThanksTokenImplAddress,
  );

  console.log("Contract addresses updated in contracts.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
