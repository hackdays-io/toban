import {
	Address,
	decodeEventLog,
	formatEther,
	keccak256,
	parseEther,
	PublicClient,
	WalletClient,
	zeroAddress,
} from "viem";
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
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SplitsCreator Factory", () => {
	let Hats: Hats;
	let HatsModuleFactory: HatsModuleFactory;
	let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
	let HatsTimeFrameModule: HatsTimeFrameModule;
	let SplitsWarehouse: SplitsWarehouse;
	let PullSplitsFactory: PullSplitsFactory;
	let PushSplitsFactory: PushSplitsFactory;
	let SplitsCreatorFactory: SplitsCreatorFactory;
	let SplitsCreator_IMPL: SplitsCreator;
	let SplitsCreator: SplitsCreator;
	let FractionToken: FractionToken;

	let address1: WalletClient;

	let topHatId: bigint;

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

		[address1] = await viem.getWalletClients();

		await Hats.write.mintTopHat([
			address1.account?.address!,
			"Description",
			"https://test.com/tophat.png",
		]);

		topHatId = BigInt(
			"0x0000000100000000000000000000000000000000000000000000000000000000"
		);

		await HatsModuleFactory.write.createHatsModule([
			HatsTimeFrameModule_IMPL.address,
			topHatId,
			"0x",
			"0x",
			BigInt(0),
		]);

		const hatsTimeFrameModuleAddress =
			await HatsModuleFactory.read.getHatsModuleAddress([
				HatsTimeFrameModule_IMPL.address,
				topHatId,
				"0x",
				BigInt(0),
			]);

		HatsTimeFrameModule = await viem.getContractAt(
			"HatsTimeFrameModule",
			hatsTimeFrameModuleAddress
		);
	});

	it("Should deploy SplitsCreatorFactory", async () => {
		const { SplitsCreatorFactory: _SplitsCreatorFactory } =
			await deploySplitsCreatorFactory(SplitsCreator_IMPL.address);

		SplitsCreatorFactory = _SplitsCreatorFactory;

		expect(SplitsCreatorFactory.address).to.be.a("string");
		expect(
			await SplitsCreatorFactory.read.predictDeterministicAddress([
				topHatId,
				zeroAddress,
				PullSplitsFactory.address,
				HatsTimeFrameModule.address,
				FractionToken.address,
				keccak256("0x1234"),
			])
		).to.be.a("string");
	});

	it("Should deploy SplitsCreator", async () => {
		const predictedAddress =
			await SplitsCreatorFactory.read.predictDeterministicAddress([
				topHatId,
				address1.account?.address!,
				PullSplitsFactory.address,
				HatsTimeFrameModule.address,
				FractionToken.address,
				keccak256("0x1234"),
			]);

		await SplitsCreatorFactory.write.createSplitCreatorDeterministic([
			topHatId,
			address1.account?.address!,
			PullSplitsFactory.address,
			HatsTimeFrameModule.address,
			FractionToken.address,
			keccak256("0x1234"),
		]);

		SplitsCreator = await viem.getContractAt("SplitsCreator", predictedAddress);

		expect(
			(await SplitsCreator.read.HATS_TIME_FRAME_MODULE()).toLowerCase()
		).equal(HatsTimeFrameModule.address.toLowerCase());
		expect((await SplitsCreator.read.FRACTION_TOKEN()).toLowerCase()).equal(
			FractionToken.address.toLowerCase()
		);
	});
});

describe("CreateSplit", () => {
	let Hats: Hats;
	let HatsModuleFactory: HatsModuleFactory;
	let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
	let HatsTimeFrameModule: HatsTimeFrameModule;
	let SplitsWarehouse: SplitsWarehouse;
	let PullSplitsFactory: PullSplitsFactory;
	let PushSplitsFactory: PushSplitsFactory;
	let SplitsCreatorFactory: SplitsCreatorFactory;
	let SplitsCreator_IMPL: SplitsCreator;
	let SplitsCreator: SplitsCreator;
	let FractionToken: FractionToken;

	let address1: WalletClient;
	let address2: WalletClient;
	let address3: WalletClient;

	let topHatId: bigint;
	let hatterHatId: bigint;
	let hat1_id: bigint;
	let hat2_id: bigint;

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

		[address1, address2, address3] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();

		await Hats.write.mintTopHat([
			address1.account?.address!,
			"Description",
			"https://test.com/tophat.png",
		]);

		topHatId = BigInt(
			"0x0000000100000000000000000000000000000000000000000000000000000000"
		);

		await HatsModuleFactory.write.createHatsModule([
			HatsTimeFrameModule_IMPL.address,
			topHatId,
			"0x",
			"0x",
			BigInt(0),
		]);

		const hatsTimeFrameModuleAddress =
			await HatsModuleFactory.read.getHatsModuleAddress([
				HatsTimeFrameModule_IMPL.address,
				topHatId,
				"0x",
				BigInt(0),
			]);

		HatsTimeFrameModule = await viem.getContractAt(
			"HatsTimeFrameModule",
			hatsTimeFrameModuleAddress
		);

		const { SplitsCreatorFactory: _SplitsCreatorFactory } =
			await deploySplitsCreatorFactory(SplitsCreator_IMPL.address);

		SplitsCreatorFactory = _SplitsCreatorFactory;

		let txHash =
			await SplitsCreatorFactory.write.createSplitCreatorDeterministic([
				topHatId,
				address1.account?.address!,
				PullSplitsFactory.address,
				HatsTimeFrameModule.address,
				FractionToken.address,
				keccak256("0x1234"),
			]);

		let receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: SplitsCreatorFactory.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "SplitCreatorCreated") {
					SplitsCreator = await viem.getContractAt(
						"SplitsCreator",
						decodedLog.args.splitCreator
					);
				}
			} catch (error) {}
		}

		txHash = await Hats.write.createHat([
			topHatId,
			"hatterHat",
			3,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"https://test.com/hat_image.png",
		]);

		receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "HatCreated")
					hatterHatId = decodedLog.args.id;
			} catch (error) {}
		}

		txHash = await Hats.write.createHat([
			hatterHatId,
			"role1",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"https://test.com/hat_image.png",
		]);

		receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "HatCreated") hat1_id = decodedLog.args.id;
			} catch (error) {}
		}

		txHash = await Hats.write.createHat([
			hatterHatId,
			"role2",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"https://test.com/hat_image.png",
		]);

		receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "HatCreated") hat2_id = decodedLog.args.id;
			} catch (error) {}
		}

		await Hats.write.mintHat([hatterHatId, HatsTimeFrameModule.address]);

		await HatsTimeFrameModule.write.mintHat([
			hat1_id,
			address1.account?.address!,
		]);

		await time.increase(500000);

		await HatsTimeFrameModule.write.mintHat([
			hat1_id,
			address2.account?.address!,
		]);
		await HatsTimeFrameModule.write.mintHat([
			hat2_id,
			address3.account?.address!,
		]);
	});

	it("should create a split", async () => {
		const txHash = await SplitsCreator.write.create([
			[
				{
					hatId: hat1_id,
					wearers: [address1.account?.address!, address2.account?.address!],
					multiplierBottom: 1n,
					multiplierTop: 1n,
				},
				{
					hatId: hat2_id,
					wearers: [address3.account?.address!],
					multiplierBottom: 1n,
					multiplierTop: 2n,
				},
			],
		]);

		const receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		let splitAddress!: Address;

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: SplitsCreator.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "SplitsCreated")
					splitAddress = decodedLog.args.split;
			} catch (error) {}
		}

		await address1.sendTransaction({
			account: address1.account!,
			to: splitAddress,
			value: parseEther("1000"),
			chain: undefined,
		});

		const beforeAddress1Balance = await publicClient.getBalance({
			address: address1.account?.address!,
		});
		const beforeAddress2Balance = await publicClient.getBalance({
			address: address2.account?.address!,
		});
		const beforeAddress3Balance = await publicClient.getBalance({
			address: address3.account?.address!,
		});

		const Split = await viem.getContractAt("PullSplit", splitAddress);
		await Split.write.distribute([
			{
				recipients: [
					address1.account?.address!,
					address2.account?.address!,
					address3.account?.address!,
				],
				allocations: [7070000, 10000, 20000],
				totalAllocation: 7100000,
				distributionIncentive: 0,
			},
			"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
			address1.account?.address!,
		] as any);

		// withdrawを実行
		await SplitsWarehouse.write.withdraw(
			[
				address1.account?.address!,
				"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
			],
			{
				account: address1.account!,
			}
		);
		await SplitsWarehouse.write.withdraw(
			[
				address2.account?.address!,
				"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
			],
			{
				account: address2.account!,
			}
		);
		await SplitsWarehouse.write.withdraw(
			[
				address3.account?.address!,
				"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
			],
			{
				account: address3.account!,
			}
		);

		const afterAddress1Balance = await publicClient.getBalance({
			address: address1.account?.address!,
		});
		const afterAddress2Balance = await publicClient.getBalance({
			address: address2.account?.address!,
		});
		const afterAddress3Balance = await publicClient.getBalance({
			address: address3.account?.address!,
		});

		expect(Number(afterAddress1Balance) - Number(beforeAddress1Balance)).gt(
			500
		);
		expect(Number(afterAddress2Balance) - Number(beforeAddress2Balance)).gt(
			249
		);
		expect(Number(afterAddress3Balance) - Number(beforeAddress3Balance)).gt(
			249
		);
	});
});
