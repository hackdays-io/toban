import * as dotenv from "dotenv";
import { network } from "hardhat";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";
import { upgradeFractionToken } from "../../helpers/upgrade/fractionToken";

dotenv.config();

/**
 * FractionTokenをアップグレードするスクリプト
 * @returns
 */
const upgrade = async () => {
  console.log(
    "##################################### [Upgrade START] #####################################",
  );

  // FractionTokenコントラクトの各アドレスをjsonファイルから取得してくる。
  const {
    contracts: { FractionToken },
  } = loadDeployedContractAddresses(network.name);

  // FractionTokenコントラクトをアップグレードする
  const newFractionToken = await upgradeFractionToken(
    FractionToken,
    "FractionToken", // ここにアップグレード後のFractionTokenのコントラクト名を指定する。
  );

  console.log("upgrded address:", newFractionToken.address);

  console.log(
    "##################################### [Upgrade END] #####################################",
  );

  return;
};

upgrade();
