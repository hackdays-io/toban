import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

/**
 * 【Task】execute bigbang method
 */
task("bigbang", "bigbang")
	.addParam("owner", "The address of the user who will own the topHat.")
	.addParam("tophatdetails", "The details of the topHat.")
	.addParam("tophatimageuri", "The image URI of the topHat.")
	.addParam("hatterhatdetails", "The details of the hatterHat.")
	.addParam("hatterhatimageuri", "The image URI of the hatterHat.")
	.addParam("forwarder", "The address of the trusted forwarder.")
	.setAction(async (taskArgs: any, hre: HardhatRuntimeEnvironment) => {
		console.log(
			"################################### [START] ###################################"
		);
		const [bobWalletClient] = await hre.viem.getWalletClients();

		// BigBangコントラクトのアドレスをjsonファイルから取得してくる。
		const {
			contracts: { BigBang },
		} = loadDeployedContractAddresses(hre.network.name);

		// create BigBang instance
		const bigbang = await hre.viem.getContractAt("BigBang", BigBang);

		// call bigbang method
		const tx = await bigbang.write.bigbang([
			bobWalletClient.account?.address!,
			taskArgs.tophatdetails,
			taskArgs.tophatimageuri,
			taskArgs.hatterhatdetails,
			taskArgs.hatterhatimageuri,
			taskArgs.forwarder,
		]);

		console.log(`tx: ${tx}`);

		console.log(
			"################################### [END] ###################################"
		);
	});
