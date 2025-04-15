import { ethers, upgrades, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "./Create2Factory";
import { ProxyFactory } from "./Upgradeable";

export type ThanksToken = Awaited<
  ReturnType<typeof deployThanksToken>
>["ThanksToken"];

/**
 * Deploy ThanksToken with Create2 for production use
 */
export const deployThanksToken = async (
  uri: string,
  maxThanksPerTx: bigint,
  dailyThanksLimit: bigint,
  create2DeployerAddress?: string,
) => {
  const [deployer] = await ethers.getSigners();

  // Deploy implementation using Create2 for deterministic address
  const ThanksTokenFactory = await ethers.getContractFactory("ThanksToken");
  const ThanksTokenImplTx = await ThanksTokenFactory.getDeployTransaction();
  const ThanksTokenImplAddress = await deployContract_Create2(
    baseSalt,
    ThanksTokenImplTx.data || "0x",
    ethers.keccak256(ThanksTokenImplTx.data),
    "ThanksToken_Implementation",
    create2DeployerAddress,
  );

  // Prepare initialization data
  const ThanksTokenInitData = ThanksTokenFactory.interface.encodeFunctionData(
    "initialize",
    [deployer.address, maxThanksPerTx, dailyThanksLimit, uri],
  );

  // Deploy proxy using Create2
  const UpgradeableProxy = await ProxyFactory();
  const ThanksTokenProxyTx = await UpgradeableProxy.getDeployTransaction(
    ThanksTokenImplAddress,
    ThanksTokenInitData,
  );
  const ThanksTokenAddress = await deployContract_Create2(
    baseSalt,
    ThanksTokenProxyTx.data || "0x",
    ethers.keccak256(ThanksTokenProxyTx.data),
    "ThanksToken",
    create2DeployerAddress,
  );

  // Create a new instance of the contract with viem
  const ThanksToken = await viem.getContractAt(
    "ThanksToken",
    ThanksTokenAddress as Address,
  );

  return {
    ThanksToken,
    ThanksTokenImplAddress,
    ThanksTokenInitData,
  };
};
