import {ethers} from "hardhat";

export const deployFractionToken = async (
  uri: string,
  hatsContractAddress: string,
  forwarderContractAddress: string
) => {
  const FractionTokenFactory = await ethers.getContractFactory("FractionToken");
  const FractionToken = await FractionTokenFactory.deploy(
    uri,
    hatsContractAddress,
    forwarderContractAddress
  );
  await FractionToken.waitForDeployment();

  return {FractionToken};
};
