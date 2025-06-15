import { ethers, viem } from "hardhat";
import { type Address, zeroAddress } from "viem";
import { baseSalt, deployContract_Create2 } from "./Create2Factory";

export type Hats = Awaited<ReturnType<typeof deployHatsProtocol>>["Hats"];

export type HatsModuleFactory = Awaited<
  ReturnType<typeof deployHatsModuleFactory>
>["HatsModuleFactory"];

export type HatsModule = Awaited<
  ReturnType<typeof deployEmptyHatsModule>
>["HatsModule"];

export type HatsTimeFrameModule = Awaited<
  ReturnType<typeof deployHatsTimeFrameModule>
>["HatsTimeFrameModule"];

export type HatsHatCreatorModule = Awaited<
  ReturnType<typeof deployHatsHatCreatorModule>
>["HatsHatCreatorModule"];

export type HatsRoleModule = Awaited<
  ReturnType<typeof deployHatsRoleModule>
>["HatsRoleModule"];

export const deployHatsProtocol = async () => {
  const Hats = await viem.deployContract("Hats", ["test", "https://test.com"]);

  return { Hats };
};

export const deployHatsModuleFactory = async (hatsAddress: Address) => {
  const HatsModuleFactory = await viem.deployContract("HatsModuleFactory", [
    hatsAddress,
    "0.0.1",
  ]);

  return { HatsModuleFactory };
};

export const deployEmptyHatsModule = async () => {
  const HatsModule = await viem.deployContract("HatsModule", ["0.0.0"]);

  return { HatsModule };
};

export const deployHatsTimeFrameModule = async (
  tmpOwner: Address,
  version = "0.0.0",
  create2DeployerAddress?: string,
) => {
  const HatsTimeFrameModuleFactory = await ethers.getContractFactory(
    "HatsTimeFrameModule",
  );
  const HatsTimeFrameModuleTx =
    await HatsTimeFrameModuleFactory.getDeployTransaction(version, tmpOwner);
  const HatsTimeFrameModuleAddress = await deployContract_Create2(
    baseSalt,
    HatsTimeFrameModuleTx.data || "0x",
    ethers.keccak256(HatsTimeFrameModuleTx.data),
    "HatsTimeFrameModule",
    create2DeployerAddress,
  );

  const HatsTimeFrameModule = await viem.getContractAt(
    "HatsTimeFrameModule",
    HatsTimeFrameModuleAddress as Address,
  );

  return { HatsTimeFrameModule };
};

export const deployHatsRoleModule = async (
  tmpOwner: Address,
  version = "0.0.0",
  create2DeployerAddress?: string,
) => {
  const HatsRoleModuleFactory =
    await ethers.getContractFactory("HatsRoleModule");
  const HatsRoleModuleTx = await HatsRoleModuleFactory.getDeployTransaction(
    version,
    tmpOwner,
  );
  const HatsRoleModuleAddress = await deployContract_Create2(
    baseSalt,
    HatsRoleModuleTx.data || "0x",
    ethers.keccak256(HatsRoleModuleTx.data),
    "HatsRoleModule",
    create2DeployerAddress,
  );

  const HatsRoleModule = await viem.getContractAt(
    "HatsRoleModule",
    HatsRoleModuleAddress as Address,
  );

  return { HatsRoleModule };
};

export const deployHatsHatCreatorModule = async (
  tmpOwner: Address,
  version = "0.0.0",
  create2DeployerAddress?: string,
) => {
  const HatsHatCreatorModuleFactory = await ethers.getContractFactory(
    "HatsHatCreatorModule",
  );
  const HatsHatCreatorModuleTx =
    await HatsHatCreatorModuleFactory.getDeployTransaction(version, tmpOwner);
  const HatsHatCreatorModuleAddress = await deployContract_Create2(
    baseSalt,
    HatsHatCreatorModuleTx.data || "0x",
    ethers.keccak256(HatsHatCreatorModuleTx.data),
    "HatsHatCreatorModule",
    create2DeployerAddress,
  );

  const HatsHatCreatorModule = await viem.getContractAt(
    "HatsHatCreatorModule",
    HatsHatCreatorModuleAddress as Address,
  );

  return { HatsHatCreatorModule };
};
