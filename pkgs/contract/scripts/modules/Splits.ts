import {ethers} from "hardhat";

export const deploySplitsProtocol = async () => {
  const warehouseFactory = await ethers.getContractFactory("SplitsWarehouse");
  const SplitsWarehouse = await warehouseFactory.deploy("ETH", "ETH");
  await SplitsWarehouse.waitForDeployment();

  const pullFactory = await ethers.getContractFactory("PullSplitFactory");
  const PullSplitsFactory = await pullFactory.deploy(
    await SplitsWarehouse.getAddress()
  );
  await PullSplitsFactory.waitForDeployment();

  const pushFactory = await ethers.getContractFactory("PushSplitFactory");
  const PushSplitsFactory = await pushFactory.deploy(
    await SplitsWarehouse.getAddress()
  );
  await PushSplitsFactory.waitForDeployment();

  const sampleForwarder = await ethers.getContractFactory("SampleForwarder");
  const SampleForwarder = await sampleForwarder.deploy();
  await SampleForwarder.waitForDeployment();

  return {
    SplitsWarehouse,
    PullSplitsFactory,
    PushSplitsFactory,
    SampleForwarder,
  };
};

export const deploySplitCreator = async (
  splitFactoryAddress: string,
  fractionTokenAddress: string,
  forwarderAddress: string
) => {
  const splitCreatorFactory = await ethers.getContractFactory("SplitCreator");
  const SplitCreator = await splitCreatorFactory.deploy(
    splitFactoryAddress,
    fractionTokenAddress,
    forwarderAddress
  );

  return {SplitCreator};
};
