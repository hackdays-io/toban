import {ethers} from "hardhat";

export const deployForwarder = async () => {
  const ForwarderFactory = await ethers.getContractFactory("SampleForwarder");
  const Forwarder = await ForwarderFactory.deploy();

  await Forwarder.waitForDeployment();

  return {Forwarder};
};
