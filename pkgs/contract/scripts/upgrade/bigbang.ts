import * as dotenv from "dotenv";
import { network } from "hardhat";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";
import { upgradeBigBang } from "../../helpers/upgrade/bigbang";

dotenv.config();

/**
 * BigBangをアップグレードするスクリプト
 * @returns
 */
const upgrade = async () => {
  console.log(
    "##################################### [Upgrade START] #####################################",
  );

  // BigBangコントラクトの各アドレスをjsonファイルから取得してくる。
  const {
    contracts: { BigBang },
  } = loadDeployedContractAddresses(network.name);

  // BigBangコントラクトをアップグレードする
  const newBigBang = await upgradeBigBang(
    BigBang,
    "BigBang", // アップグレード後のBigBangのコントラクト名（#531: questAgentHat 対応版）
  );

  console.log("upgrded address:", newBigBang.address);

  console.log(
    "##################################### [Upgrade END] #####################################",
  );

  return;
};

upgrade();
