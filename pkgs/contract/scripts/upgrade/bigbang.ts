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
		"##################################### [Upgrade START] #####################################"
	);

	// BigBangコントラクトの各アドレスをjsonファイルから取得してくる。
	const {
		contracts: { BigBang },
	} = loadDeployedContractAddresses(network.name);

	// BigBangコントラクトをアップグレードする
	const newBigBang = await upgradeBigBang(
		BigBang,
		"BigBang_Mock_v2" // ここにアップグレード後のBigBangのコントラクト名を指定する。
	);

	console.log("upgrded address:", newBigBang.address);

	console.log(
		"##################################### [Upgrade END] #####################################"
	);

	return;
};

upgrade();
