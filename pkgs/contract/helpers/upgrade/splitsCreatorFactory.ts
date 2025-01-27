import { ethers, upgrades, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "../deploy/Create2Factory";

/**
 * SplitsCreatorFactory Contractをアップグレードするメソッド
 * @param contractAddress アップグレード対象のコントラクトアドレス
 * @param contractName アップグレード後のコントラクト名
 * @param params アップグレード時に必要なパラメータ
 * @returns
 */
export async function upgradeSplitsCreatorFacotry(
  contractAddress: Address,
  contractName: "SplitsCreatorFactory_Mock_v2",
  create2DeployerAddress?: string,
) {
  // 新しいコントラクトのファクトリーを取得
  const UpgradedSplitsCreatorFactory_Factory =
    await ethers.getContractFactory(contractName);
  const UpgradedSplitsCreatorFactory_ImplTx =
    await UpgradedSplitsCreatorFactory_Factory.getDeployTransaction();
  const UpgradedSplitsCreatorFactory_ImplAddress = await deployContract_Create2(
    baseSalt,
    UpgradedSplitsCreatorFactory_ImplTx.data || "0x",
    ethers.keccak256(UpgradedSplitsCreatorFactory_ImplTx.data),
    `${contractName}_Implementation`,
    create2DeployerAddress,
  );

  const UpgradedSplitsCreatorFactory = await viem.getContractAt(
    contractName,
    contractAddress,
  );

  await UpgradedSplitsCreatorFactory.write.upgradeToAndCall([
    UpgradedSplitsCreatorFactory_ImplAddress,
    "0x",
  ]);

  return { UpgradedSplitsCreatorFactory };
}
