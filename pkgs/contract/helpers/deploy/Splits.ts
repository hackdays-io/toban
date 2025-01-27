import { ethers, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "./Create2Factory";
import { ProxyFactory } from "./Upgradeable";

export type SplitsWarehouse = Awaited<
  ReturnType<typeof deploySplitsProtocol>
>["SplitsWarehouse"];

export type PullSplitsFactory = Awaited<
  ReturnType<typeof deploySplitsProtocol>
>["PullSplitsFactory"];

export type PushSplitsFactory = Awaited<
  ReturnType<typeof deploySplitsProtocol>
>["PushSplitsFactory"];

export type SplitsCreatorFactory = Awaited<
  ReturnType<typeof deploySplitsCreatorFactory>
>["SplitsCreatorFactory"];

export type SplitsCreator = Awaited<
  ReturnType<typeof deploySplitsCreator>
>["SplitsCreator"];

export const deploySplitsProtocol = async () => {
  const SplitsWarehouse = await viem.deployContract("SplitsWarehouse", [
    "ETH",
    "ETH",
  ]);

  const PullSplitsFactory = await viem.deployContract("PullSplitFactory", [
    SplitsWarehouse.address,
  ]);

  const PushSplitsFactory = await viem.deployContract("PushSplitFactory", [
    SplitsWarehouse.address,
  ]);

  return {
    SplitsWarehouse,
    PullSplitsFactory,
    PushSplitsFactory,
  };
};

export const deploySplitsCreatorFactory = async (
  splitsCreatorImpl: Address,
  create2DeployerAddress?: string,
) => {
  const [deployer] = await ethers.getSigners();

  const splitsCreatorFactory = await ethers.getContractFactory(
    "SplitsCreatorFactory",
  );

  const splitsCreatorFactoryImplTx =
    await splitsCreatorFactory.getDeployTransaction();
  const SplitsCreatorFactoryImplAddress = await deployContract_Create2(
    baseSalt,
    splitsCreatorFactoryImplTx.data || "0x",
    ethers.keccak256(splitsCreatorFactoryImplTx.data),
    "SplitsCreatorFactory",
    create2DeployerAddress,
  );

  const SplitsCreatorFactoryInitData =
    splitsCreatorFactory.interface.encodeFunctionData("initialize", [
      deployer.address,
      splitsCreatorImpl,
    ]);
  const UpgradeProxy = await ProxyFactory();
  const splitsCreatorFactoryProxyTx = await UpgradeProxy.getDeployTransaction(
    SplitsCreatorFactoryImplAddress,
    SplitsCreatorFactoryInitData,
  );
  const splitsCreatorFactoryAddress = await deployContract_Create2(
    baseSalt,
    splitsCreatorFactoryProxyTx.data || "0x",
    ethers.keccak256(splitsCreatorFactoryProxyTx.data),
    "SplitsCreatorFactory",
    create2DeployerAddress,
  );

  // create a new instance of the contract
  const SplitsCreatorFactory = await viem.getContractAt(
    "SplitsCreatorFactory",
    splitsCreatorFactoryAddress as Address,
  );

  return {
    SplitsCreatorFactory,
    SplitsCreatorFactoryImplAddress,
    SplitsCreatorFactoryInitData,
  };
};

export const deploySplitsCreator = async (create2DeployerAddress?: string) => {
  const SplitsCreatorFactory = await ethers.getContractFactory("SplitsCreator");

  const splitsCreatorTx = await SplitsCreatorFactory.getDeployTransaction();
  const splitsCreatorAddress = await deployContract_Create2(
    baseSalt,
    splitsCreatorTx.data || "0x",
    ethers.keccak256(splitsCreatorTx.data),
    "SplitsCreator",
    create2DeployerAddress,
  );

  const SplitsCreator = await viem.getContractAt(
    "SplitsCreator",
    splitsCreatorAddress as Address,
  );

  return { SplitsCreator };
};
