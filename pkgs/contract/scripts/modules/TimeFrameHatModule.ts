import {ethers} from "hardhat";

export const deployTimeFrameHatModule = async (
  hatsAddress: string,
  forwarderAddress: string
) => {
  const timeFrameHatModuleFactory = await ethers.getContractFactory(
    "TimeFrameHatModule"
  );
  const TimeFrameHatModule = await timeFrameHatModuleFactory.deploy(
    hatsAddress,
    forwarderAddress
  );
  await TimeFrameHatModule.waitForDeployment();

  return {TimeFrameHatModule};
};
