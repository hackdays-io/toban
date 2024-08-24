import {ethers} from "hardhat";

export const deployFractionToken = async (
  uri: string,
  hatsContractAddress: string
) => {
  const FractionTokenFactory = await ethers.getContractFactory("FractionToken");
  const FractionToken = await FractionTokenFactory.deploy(
    uri,
    hatsContractAddress
  );
  await FractionToken.waitForDeployment();

  return {FractionToken};
};
