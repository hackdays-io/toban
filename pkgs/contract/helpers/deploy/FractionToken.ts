import { ethers, upgrades, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "./Create2Factory";
import { ProxyFactory } from "./Upgradeable";

export type FractionToken = Awaited<
  ReturnType<typeof deployFractionToken>
>["FractionToken"];

export const deployFractionToken = async (
  uri: string,
  initialSupply: bigint,
  hatsContractAddress: Address,
  create2DeployerAddress?: string,
  maxSupply = 1000000n,
) => {
  const [deployer] = await ethers.getSigners();
  const _initialSupply = !initialSupply ? 10000n : initialSupply;
  const _maxSupply = !maxSupply ? 1000000n : maxSupply;

  const FractionTokenFactory = await ethers.getContractFactory("FractionToken");
  const FractionTokenImplTx = await FractionTokenFactory.getDeployTransaction();
  const FractionTokenImplAddress = await deployContract_Create2(
    baseSalt,
    FractionTokenImplTx.data || "0x",
    ethers.keccak256(FractionTokenImplTx.data),
    "FractionToken_Implementation",
    create2DeployerAddress,
  );

  const FractionTokenInitData =
    FractionTokenFactory.interface.encodeFunctionData("initialize", [
      deployer.address,
      _initialSupply,
      _maxSupply,
      hatsContractAddress,
      uri,
    ]);

  const UpgradeableProxy = await ProxyFactory();
  const FractionTokenProxyTx = await UpgradeableProxy.getDeployTransaction(
    FractionTokenImplAddress,
    FractionTokenInitData,
  );
  const FractionTokenAddress = await deployContract_Create2(
    baseSalt,
    FractionTokenProxyTx.data || "0x",
    ethers.keccak256(FractionTokenProxyTx.data),
    "FractionToken",
    create2DeployerAddress,
  );

  // create a new instance of the contract
  const FractionToken = await viem.getContractAt(
    "FractionToken",
    FractionTokenAddress as Address,
  );

  return { FractionToken, FractionTokenImplAddress, FractionTokenInitData };
};
