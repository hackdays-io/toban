import { ethers, upgrades, viem } from "hardhat";
import type { Address } from "viem";

/**
 * FractionToken Contractをアップグレードするメソッド
 * @param contractAddress アップグレード対象のコントラクトアドレス
 * @param contractName アップグレード後のコントラクト名
 * @param params アップグレード時に必要なパラメータ
 * @returns
 */
export const upgradeFractionToken = async (
  contractAddress: string,
  contractName: string,
  params?: unknown[],
) => {
  // 新しいコントラクトのファクトリーを取得
  const FractionToken = await ethers.getContractFactory(contractName);

  // アップグレードを実行
  const _FractionToken = await upgrades.upgradeProxy(
    contractAddress,
    FractionToken,
  );

  const address = _FractionToken.target;

  //console.log("upgraded address:", address);

  // create a new instance of the contract
  const newFractionToken = await viem.getContractAt(
    contractName,
    address as Address,
  );

  return newFractionToken;
};
