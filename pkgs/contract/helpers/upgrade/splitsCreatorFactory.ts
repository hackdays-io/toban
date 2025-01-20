import { ethers, upgrades, viem } from "hardhat";
import type { Address } from "viem";

/**
 * SplitsCreatorFactory Contractをアップグレードするメソッド
 * @param contractAddress アップグレード対象のコントラクトアドレス
 * @param contractName アップグレード後のコントラクト名
 * @param params アップグレード時に必要なパラメータ
 * @returns
 */
export async function upgradeSplitsCreatorFacotry(
  contractAddress: string,
  contractName: string,
) {
  // 新しいコントラクトのファクトリーを取得
  const SplitsCreator_Mock_v2 = await ethers.getContractFactory(contractName);

  // アップグレードを実行
  const _SplitsCreatorFactory = await upgrades.upgradeProxy(
    contractAddress,
    SplitsCreator_Mock_v2,
  );

  // 新しいアドレスを取得
  const address = _SplitsCreatorFactory.target;

  // create a new instance of the contract
  const newSplitsCreatorFactory = await viem.getContractAt(
    contractName,
    address as Address,
  );

  return newSplitsCreatorFactory;
}
