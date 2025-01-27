import { ethers, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "./Create2Factory";
import { ProxyFactory } from "./Upgradeable";

export type BigBang = Awaited<ReturnType<typeof deployBigBang>>["BigBang"];

export const deployBigBang = async (
  params: {
    hatsContractAddress: Address;
    hatsModuleFacotryAddress: Address;
    hatsTimeFrameModule_impl: Address;
    hatsHatCreatorModule_impl: Address;
    splitsCreatorFactoryAddress: Address;
    splitsFactoryV2Address: Address;
    fractionTokenAddress: Address;
  },
  create2DeployerAddress?: string,
) => {
  const [deployer] = await ethers.getSigners();

  const BigBangFactory = await ethers.getContractFactory("BigBang");
  const BigBangImplTx = await BigBangFactory.getDeployTransaction();
  const BigBangImplAddress = await deployContract_Create2(
    baseSalt,
    BigBangImplTx.data || "0x",
    ethers.keccak256(BigBangImplTx.data),
    "BigBang_Implementation",
    create2DeployerAddress,
  );

  const BigBangInitData = BigBangFactory.interface.encodeFunctionData(
    "initialize",
    [
      deployer.address,
      params.hatsContractAddress,
      params.hatsModuleFacotryAddress,
      params.hatsTimeFrameModule_impl,
      params.hatsHatCreatorModule_impl,
      params.splitsCreatorFactoryAddress,
      params.splitsFactoryV2Address,
      params.fractionTokenAddress,
    ],
  );

  const UpgradeableProxy = await ProxyFactory();
  const BigBangProxyTx = await UpgradeableProxy.getDeployTransaction(
    BigBangImplAddress,
    BigBangInitData,
  );
  const BigBangAddress = await deployContract_Create2(
    baseSalt,
    BigBangProxyTx.data || "0x",
    ethers.keccak256(BigBangProxyTx.data),
    "BigBang",
    create2DeployerAddress,
  );

  const BigBang = await viem.getContractAt(
    "BigBang",
    BigBangAddress as Address,
  );

  return { BigBang, BigBangImplAddress, BigBangInitData };
};
