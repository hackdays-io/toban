import {network} from "hardhat";
import {writeContractAddress} from "../../helper/contractsJsonHelper";
import {ethers} from "../util/ethers";

// npx hardhat run ignition/modules/SampleForwarder.ts --network sepolia
// npx hardhat verify --network sepolia 0x9C59a6C751a6324A0ceCfE761DfAd35F4E74D6A1
async function main() {
  const SampleForwarder = await ethers.getContractFactory("SampleForwarder");
  const sampleForwarder = await SampleForwarder.deploy();

  console.log(
    "SampleForwarder deployed to:",
    `https://sepolia.etherscan.io/address/${sampleForwarder.target}`
  );

  // write Contract Address
  writeContractAddress({
    group: "contracts",
    name: "SampleForwarder",
    value: sampleForwarder.target as any,
    network: network.name,
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
