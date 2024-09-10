import { decodeEventLog, PublicClient, WalletClient, zeroAddress } from "viem";
import {
	deployHatsModuleFactory,
	deployHatsProtocol,
	deployHatsTimeFrameModule,
	deployBigBang,
	Hats,
	HatsModuleFactory,
	HatsTimeFrameModule,
	BigBang,
} from "../helpers/deploy/Hats";
import { viem } from "hardhat";
import { expect } from "chai";

describe("BigBang", () => {
	let Hats: Hats;
	let HatsModuleFactory: HatsModuleFactory;
	let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
	let HatsTimeFrameModule: HatsTimeFrameModule;
	let BigBang: BigBang;

	let address1: WalletClient;
	let address2: WalletClient;

	let topHatId: bigint;

	let publicClient: PublicClient;

	before(async () => {
		const { Hats: _Hats } = await deployHatsProtocol();
		const { HatsModuleFactory: _HatsModuleFactory } =
			await deployHatsModuleFactory(_Hats.address);
		const { HatsTimeFrameModule: _HatsTimeFrameModule } =
			await deployHatsTimeFrameModule();
		const { BigBang: _BigBang } = await deployBigBang();

		Hats = _Hats;
		HatsModuleFactory = _HatsModuleFactory;
		HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;
		BigBang = _BigBang;

		[address1, address2] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();
	});

	it("deploys the time frame module and verifies project creation", async () => {
		// BigBangコントラクトのbigbang関数を呼び出し、topHatIdを取得
		const tx = await BigBang.write.bigbang([
			"This is a bigbang function to create a project",
			1,
			address1.account?.address!,
			address2.account?.address!,
			true,
			"https://example.com/image.png",
			zeroAddress, // trustedForwarder
		]);

		// 取引の結果をデコードして取得
		const receipt = await publicClient.waitForTransactionReceipt({
			hash: tx.hash,
		});
		const event = decodeEventLog({
			abi: BigBang.abi,
			receipt,
			name: "TopHatMinted",
		});

		topHatId = event.args.topHatId;

		// 生成されたTopHatのIDが正しいことを検証
		expect(topHatId).to.not.be.undefined;
		expect(topHatId).to.be.a("bigint");

		// 確認のために生成されたハットのバランスをチェック
		const balance = await Hats.read.balanceOf([
			address1.account?.address!,
			topHatId,
		]);
		expect(balance).to.equal(BigInt(1));
	});
});
