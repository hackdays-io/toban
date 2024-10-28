import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

/**
 * 【Task】get getWoreTime of HatsTimeFrameModule
 */
task("getWoreTime", "getWoreTime")
	.addParam("wearer", "address of wearer")
	.setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
		console.log(
			"################################### [START] ###################################"
		);

		// BigBangコントラクトのアドレスをjsonファイルから取得してくる。
		const {
			contracts: { HatsTimeFrameModule },
		} = loadDeployedContractAddresses(hre.network.name);

		// create HatsTimeFrameModule instance
		const hatsTimeFrameModuleByBigBang = await hre.viem.getContractAt(
			"HatsTimeFrameModule",
			HatsTimeFrameModule
		);

		// call getWoreTime method
		const woreTime = await hatsTimeFrameModuleByBigBang.read.getWoreTime([
			taskArgs.wearer,
			0n,
		]);

		console.log(`woreTime: ${woreTime}`);

		console.log(
			"################################### [END] ###################################"
		);
	});
