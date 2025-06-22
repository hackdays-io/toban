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

export type HatsFractionTokenModule = Awaited<
  ReturnType<typeof deployHatsFractionTokenModule>
>["HatsFractionTokenModule"];

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
    await HatsTimeFrameModuleFactory.getDeployTransaction(version);
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

export const deployHatsHatCreatorModule = async (
  tmpOwner: Address,
  version = "0.0.0",
  create2DeployerAddress?: string,
) => {
  const HatsHatCreatorModuleFactory = await ethers.getContractFactory(
    "HatsHatCreatorModule",
  );
  const HatsHatCreatorModuleTx =
    await HatsHatCreatorModuleFactory.getDeployTransaction(version);
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

export const deployHatsFractionTokenModule = async (
  tmpOwner: Address,
  version = "0.0.0",
  create2DeployerAddress?: string,
) => {
  const HatsFractionTokenModuleFactory = await ethers.getContractFactory(
    "HatsFractionTokenModule",
  );
  const HatsFractionTokenModuleTx =
    await HatsFractionTokenModuleFactory.getDeployTransaction(
      version,
      tmpOwner,
    );
  const HatsFractionTokenModuleAddress = await deployContract_Create2(
    baseSalt,
    HatsFractionTokenModuleTx.data || "0x",
    ethers.keccak256(HatsFractionTokenModuleTx.data),
    "HatsFractionTokenModule",
    create2DeployerAddress,
  );

  const HatsFractionTokenModule = await viem.getContractAt(
    "HatsFractionTokenModule",
    HatsFractionTokenModuleAddress as Address,
  );

  return { HatsFractionTokenModule };
};
