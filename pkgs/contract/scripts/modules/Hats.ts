import {ethers} from "hardhat";

export const deployHatsProtocol = async () => {
  const factory = await ethers.getContractFactory("Hats");
  const Hats = await factory.deploy("test", "https://test.com");
  await Hats.waitForDeployment();

  return {Hats};
};

export const mintTopHat = async () => {};
