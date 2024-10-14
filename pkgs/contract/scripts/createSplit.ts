import { network, viem } from "hardhat";
import { loadDeployedContractAddresses } from "../helpers/deploy/contractsJsonHelper";

const create = async () => {
	// SplitsCreatorコントラクトのアドレスをjsonファイルから取得してくる。
	const {
		contracts: { SplitsCreator },
	} = loadDeployedContractAddresses(network.name);

	const contract = await viem.getContractAt(
		"SplitsCreator",
		SplitsCreator
		// "0xf7f536b25d3f1aEb84E32A35ca8E48b6fd0597A7"
	);

	const res = await contract.write.create([
		[
			{
				hatId: BigInt(
					"0x0000023900010001000000000000000000000000000000000000000000000000"
				),
				multiplierBottom: 1n,
				multiplierTop: 1n,
				wearers: ["0x777EE5eeEd30c3712bEE6C83260D786857d9C556"],
			},
		],
	]);

	console.log(res);
};

create();
