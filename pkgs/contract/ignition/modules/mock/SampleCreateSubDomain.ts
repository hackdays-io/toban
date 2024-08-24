import {network} from "hardhat";
import {writeContractAddress} from "../../../helper/contractsJsonHelper";
import {ethers} from "../../util/ethers";

// npx hardhat run ignition/modules/mock/SampleCreateSubDomain.ts --network sepolia
// npx hardhat verify --network sepolia 0x9C59a6C751a6324A0ceCfE761DfAd35F4E74D6A1
async function main() {
  const SampleCreateSubDomain = await ethers.getContractFactory(
    "SampleCreateSubDomain"
  );
  const sampleCreateSubDomain = await SampleCreateSubDomain.deploy(
    "contract.toban.eth"
  );

  console.log(
    "SampleCreateSubDomain deployed to:",
    `https://sepolia.etherscan.io/address/${sampleCreateSubDomain.target}`
  );

  // write Contract Address
  writeContractAddress({
    group: "contracts",
    name: "SampleCreateSubDomain",
    value: sampleCreateSubDomain.target as any,
    network: network.name,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
