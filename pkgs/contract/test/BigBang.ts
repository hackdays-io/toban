import { decodeEventLog, PublicClient, WalletClient, zeroAddress } from "viem";
import {
	deployFractionToken,
	FractionToken,
} from "../helpers/deploy/FractionToken";
import {
	deployHatsModuleFactory,
	deployHatsProtocol,
	deployHatsTimeFrameModule,
	Hats,
	HatsModuleFactory,
	HatsTimeFrameModule,
} from "../helpers/deploy/Hats";
import {
	deploySplitsCreator,
	deploySplitsCreatorFactory,
	deploySplitsProtocol,
	PullSplitsFactory,
	PushSplitsFactory,
	SplitsCreator,
	SplitsCreatorFactory,
	SplitsWarehouse,
} from "../helpers/deploy/Splits";
import { viem } from "hardhat";
import { BigBang, deployBigBang } from "../helpers/deploy/BigBang";
import { expect } from "chai";

describe("BigBang", () => {
	let Hats: Hats;
	let HatsModuleFactory: HatsModuleFactory;
	let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
	let SplitsWarehouse: SplitsWarehouse;
	let PullSplitsFactory: PullSplitsFactory;
	let PushSplitsFactory: PushSplitsFactory;
	let SplitsCreatorFactory: SplitsCreatorFactory;
	let SplitsCreator_IMPL: SplitsCreator;
	let FractionToken: FractionToken;
	let BigBang: BigBang;

	let address1: WalletClient;

	let publicClient: PublicClient;

	before(async () => {
		const { Hats: _Hats } = await deployHatsProtocol();
		Hats = _Hats;

		const { HatsModuleFactory: _HatsModuleFactory } =
			await deployHatsModuleFactory(Hats.address);
		HatsModuleFactory = _HatsModuleFactory;

		const { HatsTimeFrameModule: _HatsTimeFrameModule } =
			await deployHatsTimeFrameModule();
		HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

		const {
			SplitsWarehouse: _SplitsWarehouse,
			PullSplitsFactory: _PullSplitsFactory,
			PushSplitsFactory: _PushSplitsFactory,
		} = await deploySplitsProtocol();

		SplitsWarehouse = _SplitsWarehouse;
		PullSplitsFactory = _PullSplitsFactory;
		PushSplitsFactory = _PushSplitsFactory;

		const { FractionToken: _FractionToken } = await deployFractionToken(
			"",
			10000n,
			Hats.address,
			zeroAddress
		);
		FractionToken = _FractionToken;

		const { SplitsCreator: _SplitsCreator } = await deploySplitsCreator();
		SplitsCreator_IMPL = _SplitsCreator;

		const { SplitsCreatorFactory: _SplitsCreatorFactory } =
			await deploySplitsCreatorFactory(SplitsCreator_IMPL.address);

		SplitsCreatorFactory = _SplitsCreatorFactory;

		[address1] = await viem.getWalletClients();
		publicClient = await viem.getPublicClient();
	});

	it("should deploy BigBang", async () => {
		const { BigBang: _BigBang } = await deployBigBang({
			trustedForwarder: address1.account?.address!,
			hatsContractAddress: Hats.address,
			hatsModuleFacotryAddress: HatsModuleFactory.address,
			hatsTimeFrameModule_impl: HatsTimeFrameModule_IMPL.address,
			splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
			splitsFactoryV2Address: PullSplitsFactory.address,
			fractionTokenAddress: FractionToken.address,
		});

		expect(_BigBang.address).to.not.be.undefined;

		BigBang = _BigBang;
	});

	it("should execute bigbang", async () => {
		const txHash = await BigBang.write.bigbang(
			[
				address1.account?.address!,
				"tophatDetails",
				"tophatURI",
				"hatterhatDetails",
				"hatterhatURI",
				address1.account?.address!,
			],
			{ account: address1.account }
		);

		const receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: BigBang.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "Executed") {
					expect(decodedLog.args.owner).to.be.equal(address1.account?.address!);
				}
			} catch (error) {}
		}
	});
});
