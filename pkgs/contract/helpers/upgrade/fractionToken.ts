import { ethers, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "../deploy/Create2Factory";

/**
 * FractionToken Contractをアップグレードするメソッド
 * @param contractAddress アップグレード対象のコントラクトアドレス
 * @param contractName アップグレード後のコントラクト名
 * @param params アップグレード時に必要なパラメータ
 * @returns
 */
export const upgradeFractionToken = async (
  contractAddress: Address,
  contractName: "FractionToken_Mock_v2",
  create2DeployerAddress?: string,
  params?: unknown[],
) => {
  // 新しいコントラクトのファクトリーを取得
  const UpgradedFractionTokenFactory =
    await ethers.getContractFactory(contractName);
  const UpgradedFractionToken_ImplTx =
    await UpgradedFractionTokenFactory.getDeployTransaction();
  const UpgradedFractionToken_ImplAddress = await deployContract_Create2(
    baseSalt,
    UpgradedFractionToken_ImplTx.data || "0x",
    ethers.keccak256(UpgradedFractionToken_ImplTx.data),
    `${contractName}_Implementation`,
    create2DeployerAddress,
  );

  const UpgradedFractionToken = await viem.getContractAt(
    contractName,
    contractAddress,
  );

  await UpgradedFractionToken.write.upgradeToAndCall([
    UpgradedFractionToken_ImplAddress,
    "0x",
  ]);

  return { UpgradedFractionToken };
};
