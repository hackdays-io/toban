import { ethers, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "./Create2Factory";
import { ProxyFactory } from "./Upgradeable";

export type ScheduledDistributor = Awaited<
  ReturnType<typeof deployScheduledDistributor>
>["ScheduledDistributor"];

export type ScheduledDistributorFactory = Awaited<
  ReturnType<typeof deployScheduledDistributorFactory>
>["ScheduledDistributorFactory"];

export const deployScheduledDistributor = async (
  create2DeployerAddress?: string,
) => {
  const Factory = await ethers.getContractFactory("ScheduledDistributor");
  const implTx = await Factory.getDeployTransaction();
  const implAddress = await deployContract_Create2(
    baseSalt,
    implTx.data || "0x",
    ethers.keccak256(implTx.data),
    "ScheduledDistributor_Implementation",
    create2DeployerAddress,
  );

  const ScheduledDistributor = await viem.getContractAt(
    "ScheduledDistributor",
    implAddress as Address,
  );

  return {
    ScheduledDistributor,
    ScheduledDistributorImplAddress: implAddress,
    ScheduledDistributorInitData: "0x",
  };
};

export const deployScheduledDistributorFactory = async (
  params: {
    initialOwner: Address;
    implementation: Address;
    hatsAddress: Address;
  },
  create2DeployerAddress?: string,
) => {
  const Factory = await ethers.getContractFactory(
    "ScheduledDistributorFactory",
  );

  const implTx = await Factory.getDeployTransaction();
  const ScheduledDistributorFactoryImplAddress = await deployContract_Create2(
    baseSalt,
    implTx.data || "0x",
    ethers.keccak256(implTx.data),
    "ScheduledDistributorFactory_Implementation",
    create2DeployerAddress,
  );

  const ScheduledDistributorFactoryInitData =
    Factory.interface.encodeFunctionData("initialize", [
      params.initialOwner,
      params.implementation,
      params.hatsAddress,
    ]);

  const UpgradeProxy = await ProxyFactory();
  const proxyTx = await UpgradeProxy.getDeployTransaction(
    ScheduledDistributorFactoryImplAddress,
    ScheduledDistributorFactoryInitData,
  );
  const factoryAddress = await deployContract_Create2(
    baseSalt,
    proxyTx.data || "0x",
    ethers.keccak256(proxyTx.data),
    "ScheduledDistributorFactory",
    create2DeployerAddress,
  );

  const ScheduledDistributorFactory = await viem.getContractAt(
    "ScheduledDistributorFactory",
    factoryAddress as Address,
  );

  return {
    ScheduledDistributorFactory,
    ScheduledDistributorFactoryImplAddress,
    ScheduledDistributorFactoryInitData,
  };
};
