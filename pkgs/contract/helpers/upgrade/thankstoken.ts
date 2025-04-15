// Import without upgrades-core which has missing typescript definitions
import { ethers, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "../deploy/Create2Factory";

export const upgradeThanksToken = async (
  thanksTokenProxyAddress: string,
  implementationName = "ThanksToken",
  create2DeployerAddress?: string,
) => {
  const provider = ethers.provider;

  // Get implementation address before upgrade
  // Note: Using direct ERC1967 storage slot querying instead of upgrades-core
  const IMPLEMENTATION_SLOT =
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const currentImplAddressBytes = await provider.getStorageAt(
    thanksTokenProxyAddress,
    IMPLEMENTATION_SLOT,
  );
  const currentImplAddress = ethers.getAddress(
    `0x${currentImplAddressBytes.slice(26)}`,
  );

  console.log("Current implementation address:", currentImplAddress);

  // Deploy new implementation
  const ThanksTokenFactory =
    await ethers.getContractFactory(implementationName);
  const ThanksTokenImplTx = await ThanksTokenFactory.getDeployTransaction();

  // Deploy using create2 for deterministic address
  const newImplAddress = await deployContract_Create2(
    baseSalt,
    ThanksTokenImplTx.data || "0x",
    ethers.keccak256(ThanksTokenImplTx.data),
    `${implementationName}_Implementation`,
    create2DeployerAddress,
  );

  // Get proxy contract and update implementation
  const ThanksTokenProxyFactory =
    await ethers.getContractFactory("ERC1967Proxy");
  const ThanksTokenProxy = ThanksTokenProxyFactory.attach(
    thanksTokenProxyAddress,
  );

  // Get UUPSUpgradeable contract to call upgradeTo
  const UUPSUpgradeableThanksToken = await ethers.getContractAt(
    "UUPSUpgradeable",
    thanksTokenProxyAddress,
  );

  // Call upgradeToAndCall method
  const upgradeTx = await UUPSUpgradeableThanksToken.upgradeTo(newImplAddress);
  await upgradeTx.wait();

  // Get upgraded contract with viem
  const UpgradedThanksToken = await viem.getContractAt(
    implementationName,
    thanksTokenProxyAddress as Address,
  );

  return {
    UpgradedThanksToken,
    UpgradedThanksTokenImplAddress: newImplAddress,
  };
};
