import { ethers, upgrades, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "./Create2Factory";
import { ProxyFactory } from "./Upgradeable";

export type ThanksToken = Awaited<
  ReturnType<typeof deployThanksToken>
>["ThanksToken"];
export type ThanksTokenFactory = Awaited<
  ReturnType<typeof deployThanksTokenFactory>
>["ThanksTokenFactory"];

export const deployThanksToken = async (create2DeployerAddress?: string) => {
  const ThanksTokenFactory = await ethers.getContractFactory("ThanksToken");
  const ThanksTokenImplTx = await ThanksTokenFactory.getDeployTransaction();
  const ThanksTokenImplAddress = await deployContract_Create2(
    baseSalt,
    ThanksTokenImplTx.data || "0x",
    ethers.keccak256(ThanksTokenImplTx.data),
    "ThanksToken_Implementation",
    create2DeployerAddress,
  );

  // ThanksToken is now a Clone implementation, no proxy or initialization needed
  // The implementation contract is deployed and will be cloned by the factory
  const ThanksToken = await viem.getContractAt(
    "ThanksToken",
    ThanksTokenImplAddress as Address,
  );

  return { ThanksToken, ThanksTokenImplAddress, ThanksTokenInitData: "0x" };
};

export const deployThanksTokenFactory = async (
  params: {
    initialOwner: Address;
    implementation: Address;
    hatsAddress: Address;
  },
  create2DeployerAddress?: string,
) => {
  const ThanksTokenFactoryFactory =
    await ethers.getContractFactory("ThanksTokenFactory");
  const ThanksTokenFactoryImplTx =
    await ThanksTokenFactoryFactory.getDeployTransaction();
  const ThanksTokenFactoryImplAddress = await deployContract_Create2(
    baseSalt,
    ThanksTokenFactoryImplTx.data || "0x",
    ethers.keccak256(ThanksTokenFactoryImplTx.data),
    "ThanksTokenFactory_Implementation",
    create2DeployerAddress,
  );

  const ThanksTokenFactoryInitData =
    ThanksTokenFactoryFactory.interface.encodeFunctionData("initialize", [
      params.initialOwner,
      params.implementation,
      params.hatsAddress,
    ]);

  const UpgradeableProxy = await ProxyFactory();
  const ThanksTokenFactoryProxyTx = await UpgradeableProxy.getDeployTransaction(
    ThanksTokenFactoryImplAddress,
    ThanksTokenFactoryInitData,
  );
  const ThanksTokenFactoryAddress = await deployContract_Create2(
    baseSalt,
    ThanksTokenFactoryProxyTx.data || "0x",
    ethers.keccak256(ThanksTokenFactoryProxyTx.data),
    "ThanksTokenFactory",
    create2DeployerAddress,
  );

  const ThanksTokenFactory = await viem.getContractAt(
    "ThanksTokenFactory",
    ThanksTokenFactoryAddress as Address,
  );

  return {
    ThanksTokenFactory,
    ThanksTokenFactoryImplAddress,
    ThanksTokenFactoryInitData,
  };
};
