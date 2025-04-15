import { ethers, viem } from "hardhat";
import type { Address } from "viem";

export type ThanksToken = Awaited<
  ReturnType<typeof deployThanksToken>
>["ThanksToken"];

export const deployThanksToken = async (
  uri: string,
  maxThanksPerTx: bigint,
  dailyThanksLimit: bigint,
) => {
  const [deployer] = await ethers.getSigners();

  // Deploy implementation
  const ThanksTokenFactory = await ethers.getContractFactory("ThanksToken");
  const thanksTokenContract = await ThanksTokenFactory.deploy();
  await thanksTokenContract.waitForDeployment();
  console.log(
    "ThanksToken deployed at:",
    await thanksTokenContract.getAddress(),
  );

  // Initialize
  await thanksTokenContract.initialize(
    deployer.address,
    maxThanksPerTx,
    dailyThanksLimit,
    uri,
  );

  // Get ThanksToken contract instance using viem
  const ThanksToken = await viem.getContractAt(
    "ThanksToken",
    (await thanksTokenContract.getAddress()) as Address,
  );

  return { ThanksToken };
};
