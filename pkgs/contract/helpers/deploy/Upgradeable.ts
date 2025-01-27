import ERC1967Proxy from "@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts-v5/proxy/ERC1967/ERC1967Proxy.sol/ERC1967Proxy.json";
import TransparentUpgradeableProxy from "@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts-v5/proxy/transparent/TransparentUpgradeableProxy.sol/TransparentUpgradeableProxy.json";
import { ethers } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "./Create2Factory";

export const deployProxyAdmin = async (
  ownerAddress: Address,
  create2DeployerAddress?: string,
) => {
  const proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin");
  const proxyAdminBytecode =
    await proxyAdminFactory.getDeployTransaction(ownerAddress);

  const proxyAdminAddress = await deployContract_Create2(
    baseSalt,
    proxyAdminBytecode.data || "0x",
    ethers.keccak256(proxyAdminBytecode.data),
    "ProxyAdmin",
    create2DeployerAddress,
  );

  return proxyAdminAddress;
};

export const ProxyFactory = async () => {
  return await ethers.getContractFactory(
    ERC1967Proxy.abi,
    ERC1967Proxy.bytecode,
  );
};

export const TransparentUpgradeableProxyFactory = async () => {
  return await ethers.getContractFactory(
    TransparentUpgradeableProxy.abi,
    TransparentUpgradeableProxy.bytecode,
  );
};
