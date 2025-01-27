import { ethers, viem } from "hardhat";
import type { Address } from "viem";

const create2DeployerAbi = [
  "function deploy(uint256 amount, bytes32 salt, bytes calldata code) public returns (address)",
  "function computeAddress(bytes32 salt, bytes32 codeHash) public view returns (address)",
];

const create2DeployerAddress = "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2";

export type Create2Deployer = Awaited<
  ReturnType<typeof deployCreate2Deployer>
>["Create2Deployer"];

export const baseSalt = ethers.keccak256(ethers.toUtf8Bytes("toban"));

export const computeAddress = async (
  salt: string,
  hash: string,
  create2Deployer: string = create2DeployerAddress,
) => {
  const create2Factory = await ethers.getContractAt(
    create2DeployerAbi,
    create2Deployer,
  );
  const computedAddress = await create2Factory.computeAddress(salt, hash);
  return computedAddress;
};

export const checkAlreadyDeployed = async (address: string) => {
  const code = await ethers.provider.getCode(address);
  return code !== "0x";
};

export const deployContract_Create2 = async (
  salt: string,
  code: string,
  hash: string,
  name: string,
  create2Deployer = create2DeployerAddress,
) => {
  const computedAddress: Address = await computeAddress(
    salt,
    hash,
    create2Deployer,
  );
  const alreadyDeployed = await checkAlreadyDeployed(computedAddress);
  if (alreadyDeployed) {
    console.log(`${name} already deployed at: ${computedAddress}`);
    return computedAddress;
  }
  const create2Factory = await ethers.getContractAt(
    create2DeployerAbi,
    create2Deployer,
  );
  const tx = await create2Factory.deploy(0, salt, code);
  await tx.wait();

  console.log(`${name} deployed at: ${computedAddress}`);

  return computedAddress;
};

export const deployCreate2Deployer = async () => {
  const Create2Deployer = await viem.deployContract("Create2Deployer");

  return { Create2Deployer };
};
