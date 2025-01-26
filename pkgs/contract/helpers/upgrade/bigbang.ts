import { ethers, viem } from "hardhat";
import type { Address } from "viem";
import { baseSalt, deployContract_Create2 } from "../deploy/Create2Factory";

/**
 * BigBang Contractをアップグレードするメソッド
 * @param contractAddress アップグレード対象のコントラクトアドレス
 * @param contractName アップグレード後のコントラクト名
 * @param params アップグレード時に必要なパラメータ
 * @returns
 */
export const upgradeBigBang = async (
  contractAddress: Address,
  contractName: "BigBang_Mock_v2",
  create2DeployerAddress?: string,
) => {
  const UpgradedBigBangFactory = await ethers.getContractFactory(contractName);
  const UpgradedBigBang_ImplTx =
    await UpgradedBigBangFactory.getDeployTransaction();
  const UpgradedBigBang_ImplAddress = await deployContract_Create2(
    baseSalt,
    UpgradedBigBang_ImplTx.data || "0x",
    ethers.keccak256(UpgradedBigBang_ImplTx.data),
    `${contractName}_Implementation`,
    create2DeployerAddress,
  );

  const UpgradedBigBang = await viem.getContractAt(
    contractName,
    contractAddress,
  );

  await UpgradedBigBang.write.upgradeToAndCall([
    UpgradedBigBang_ImplAddress,
    "0x",
  ]);

  return { UpgradedBigBang };
};
