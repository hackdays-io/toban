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

  return {SplitsWarehouse, PullSplitsFactory, PushSplitsFactory};
};
