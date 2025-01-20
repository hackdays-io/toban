import { ethers, upgrades, viem } from "hardhat";
import type { Address } from "viem";

/**
 * BigBang Contractをアップグレードするメソッド
 * @param contractAddress アップグレード対象のコントラクトアドレス
 * @param contractName アップグレード後のコントラクト名
 * @param params アップグレード時に必要なパラメータ
 * @returns
 */
export const upgradeBigBang = async (
  contractAddress: string,
  contractName: string,
) => {
  // 新しいコントラクトのファクトリーを取得
  const BigBang_Mock_v2 = await ethers.getContractFactory(contractName);
  // アップグレードを実行
  const _BigBang = await upgrades.upgradeProxy(
    contractAddress,
    BigBang_Mock_v2,
  );

  const address = _BigBang.target;

  //console.log("upgraded address:", address);

  // create a new instance of the contract
  const newBigBang = await viem.getContractAt(contractName, address as Address);

  return newBigBang;
};
