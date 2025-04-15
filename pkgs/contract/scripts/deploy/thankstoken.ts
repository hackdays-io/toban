import { ethers } from "hardhat";
import { deployCreate2Deployer } from "../../helpers/deploy/Create2Factory";
import {
  getContractFromJsonFile,
  writeContractAddressToJsonFile,
} from "../../helpers/deploy/contractsJsonHelper";
import { deployThanksToken } from "../../helpers/deploy/thankstoken";

/**
 * Deploy ThanksToken to the current network
 */
async function main() {
  const { Create2Deployer } = await deployCreate2Deployer();
  const create2Address = Create2Deployer.address;

  console.log("Deploying ThanksToken...");

  // Default values for ThanksToken
  const uri = ""; // URI for token metadata
  const maxThanksPerTx = 10n; // Maximum thanks tokens per transaction
  const dailyThanksLimit = 50n; // Daily limit of thanks a user can give

  const { ThanksToken, ThanksTokenImplAddress } = await deployThanksToken(
    uri,
    maxThanksPerTx,
    dailyThanksLimit,
    create2Address,
  );

  console.log("ThanksToken deployed to:", ThanksToken.address);
  console.log(
    "ThanksToken implementation deployed to:",
    ThanksTokenImplAddress,
  );

  // Save addresses to contracts.json
  await writeContractAddressToJsonFile("ThanksToken", ThanksToken.address);
  await writeContractAddressToJsonFile(
    "ThanksToken_Implementation",
    ThanksTokenImplAddress,
  );

  console.log("Contract addresses saved to contracts.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
