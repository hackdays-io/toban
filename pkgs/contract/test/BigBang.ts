import { expect } from "chai";
import { viem } from "hardhat";
import { decodeEventLog, PublicClient, WalletClient, zeroAddress } from "viem";
import { BigBang, deployBigBang } from "../helpers/deploy/BigBang";
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
import { upgradeBigBang } from "../helpers/upgrade/bigbang";

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
	let relayer: WalletClient;
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
			Hats.address
		);
		FractionToken = _FractionToken;

		const { SplitsCreator: _SplitsCreator } = await deploySplitsCreator();
		SplitsCreator_IMPL = _SplitsCreator;

		const { SplitsCreatorFactory: _SplitsCreatorFactory } =
			await deploySplitsCreatorFactory(SplitsCreator_IMPL.address);

		SplitsCreatorFactory = _SplitsCreatorFactory;

		[address1, relayer] = await viem.getWalletClients();
		publicClient = await viem.getPublicClient();
	});

	it("should deploy BigBang", async () => {
		const { BigBang: _BigBang } = await deployBigBang({
			hatsContractAddress: Hats.address,
			hatsModuleFacotryAddress: HatsModuleFactory.address,
			hatsTimeFrameModule_impl: HatsTimeFrameModule_IMPL.address,
			splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
			splitsFactoryV2Address: PullSplitsFactory.address,
			fractionTokenAddress: FractionToken.address,
		});

		expect(_BigBang.address).to.not.be.undefined;

		BigBang = _BigBang;

		expect((await BigBang.read.owner()).toLowerCase()).to.equal(
			address1.account?.address
		);
	});

	it("should execute bigbang", async () => {
		// SplitsCreatorFactoryにBigBangアドレスをセット
		SplitsCreatorFactory.write.setBigBang([BigBang.address]);

		const txHash = await BigBang.write.bigbang(
			[
				address1.account?.address!,
				"tophatDetails",
				"tophatURI",
				"hatterhatDetails",
				"hatterhatURI",
			],
			{ account: address1.account }
		);

		const receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog: any = decodeEventLog({
					abi: BigBang.abi as any,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "Executed") {
					expect(decodedLog.args.owner.toLowerCase()).to.be.equal(
						address1.account?.address!
					);
				}
			} catch (error) {}
		}
	});

	it("should set new hats address", async () => {
		const oldHatsAddress = Hats.address;
		const newHatsAddress = address1.account?.address!;
		const ownerAccount = address1.account;

		expect((await BigBang.read.Hats()).toLowerCase()).equal(oldHatsAddress);

		await BigBang.write.setHats([newHatsAddress], {
			account: ownerAccount,
		});

		expect((await BigBang.read.Hats()).toLowerCase()).equal(newHatsAddress);

		await BigBang.write.setHats([oldHatsAddress], {
			account: ownerAccount,
		});

		expect((await BigBang.read.Hats()).toLowerCase()).equal(oldHatsAddress);
	});

	it("should set new hats module factory address", async () => {
		const oldHatsModuleFactoryAddress = HatsModuleFactory.address;
		const newHatsModuleFactoryAddress = address1.account?.address!;
		const ownerAccount = address1.account;

		expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).equal(
			oldHatsModuleFactoryAddress
		);

		await BigBang.write.setHatsModuleFactory([newHatsModuleFactoryAddress], {
			account: ownerAccount,
		});

		expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).equal(
			newHatsModuleFactoryAddress
		);

		await BigBang.write.setHatsModuleFactory([oldHatsModuleFactoryAddress], {
			account: ownerAccount,
		});

		expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).equal(
			oldHatsModuleFactoryAddress
		);
	});

	it("should set new splits creator factory address", async () => {
		const oldSplitsCreatorFactoryAddress = SplitsCreatorFactory.address;
		const newSplitsCreatorFactoryAddress = address1.account?.address!;
		const ownerAccount = address1.account;

		expect(await BigBang.read.SplitsCreatorFactory()).equal(
			oldSplitsCreatorFactoryAddress
		);

		await BigBang.write.setSplitsCreatorFactory(
			[newSplitsCreatorFactoryAddress],
			{
				account: ownerAccount,
			}
		);

		expect((await BigBang.read.SplitsCreatorFactory()).toLowerCase()).equal(
			newSplitsCreatorFactoryAddress
		);

		await BigBang.write.setSplitsCreatorFactory(
			[oldSplitsCreatorFactoryAddress],
			{
				account: ownerAccount,
			}
		);

		expect(await BigBang.read.SplitsCreatorFactory()).equal(
			oldSplitsCreatorFactoryAddress
		);
	});

	it("should set new hats time frame module address", async () => {
		const oldHatsTimeFrameModuleAddress = HatsTimeFrameModule_IMPL.address;
		const newHatsTimeFrameModuleAddress = address1.account?.address!;
		const ownerAccount = address1.account;

		expect((await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()).equal(
			oldHatsTimeFrameModuleAddress
		);

		await BigBang.write.setHatsTimeFrameModuleImpl(
			[newHatsTimeFrameModuleAddress],
			{
				account: ownerAccount,
			}
		);

		expect((await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()).equal(
			newHatsTimeFrameModuleAddress
		);

		await BigBang.write.setHatsTimeFrameModuleImpl(
			[oldHatsTimeFrameModuleAddress],
			{
				account: ownerAccount,
			}
		);

		expect((await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()).equal(
			oldHatsTimeFrameModuleAddress
		);
	});

	it("should set new splits factory v2 address", async () => {
		const oldSplitsFactoryV2Address = PullSplitsFactory.address;
		const newSplitsFactoryV2Address = address1.account?.address!;
		const ownerAccount = address1.account;

		expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).equal(
			oldSplitsFactoryV2Address
		);

		await BigBang.write.setSplitsFactoryV2([newSplitsFactoryV2Address], {
			account: ownerAccount,
		});

		expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).equal(
			newSplitsFactoryV2Address
		);

		await BigBang.write.setSplitsFactoryV2([oldSplitsFactoryV2Address], {
			account: ownerAccount,
		});

		expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).equal(
			oldSplitsFactoryV2Address
		);
	});

	it("should set new fraction token address", async () => {
		const oldFractionTokenAddress = FractionToken.address;
		const newFractionTokenAddress = address1.account?.address!;
		const ownerAccount = address1.account;

		expect(await BigBang.read.FractionToken()).equal(oldFractionTokenAddress);

		await BigBang.write.setFractionToken([newFractionTokenAddress], {
			account: ownerAccount,
		});

		expect((await BigBang.read.FractionToken()).toLowerCase()).equal(
			newFractionTokenAddress
		);

		await BigBang.write.setFractionToken([oldFractionTokenAddress], {
			account: ownerAccount,
		});

		expect(await BigBang.read.FractionToken()).equal(oldFractionTokenAddress);
	});

	/**
	 * 以降は、Upgradeのテストコードになる。
	 * Upgrade後に再度機能をテストする。
	 */
	describe("Upgrade Test", () => {
		it("upgrde", async () => {
			// BigBangをアップグレード
			const newBigBang = await upgradeBigBang(
				BigBang.address,
				"BigBang_Mock_v2"
			);

			// upgrade後にしかないメソッドを実行
			const result = await newBigBang.read.testUpgradeFunction();
			expect(result).to.equal("testUpgradeFunction");
		});

		it("should execute bigbang after upgrade", async () => {
			// BigBangをアップグレード
			const newBigBang = await upgradeBigBang(
				BigBang.address,
				"BigBang_Mock_v2"
			);

			// SplitsCreatorFactoryにBigBangアドレスをセット
			SplitsCreatorFactory.write.setBigBang([newBigBang.address]);

			const txHash = await newBigBang.write.bigbang(
				[
					address1.account?.address!,
					"tophatDetails",
					"tophatURI",
					"hatterhatDetails",
					"hatterhatURI",
				],
				{ account: address1.account }
			);

			const receipt = await publicClient.waitForTransactionReceipt({
				hash: txHash,
			});

			for (const log of receipt.logs) {
				try {
					const decodedLog: any = decodeEventLog({
						abi: newBigBang.abi as any,
						data: log.data,
						topics: log.topics,
					});
					if (decodedLog.eventName == "Executed") {
						expect(decodedLog.args.owner.toLowerCase()).to.be.equal(
							address1.account?.address!
						);
					}
				} catch (error) {}
			}
		});
	});
});
