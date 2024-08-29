import { viem } from "hardhat";
import { expect } from "chai";
import {
	deployEmptyHatsModule,
	deployHatsModuleFactory,
	deployHatsProtocol,
	Hats,
	HatsModuleFactory,
} from "../helpers/deploy/Hats";
import {
	Address,
	decodeEventLog,
	PublicClient,
	WalletClient,
	zeroAddress,
} from "viem";

describe("Hats", () => {
	let Hats: Hats;

	let address1: WalletClient;

	let publicClient: PublicClient;

	before(async () => {
		const { Hats: _Hats } = await deployHatsProtocol();
		Hats = _Hats;

		[address1] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();
	});

	it("should mint top hat", async () => {
		await Hats.write.mintTopHat([
			address1.account?.address!,
			"Description",
			"https://test.com/tophat.png",
		]);
	});

	it("should create new hat", async () => {
		// _adminには親HatのIdを入れる
		// _eligibilityと_toggleはZeroAddress以外
		let txHash = await Hats.write.createHat([
			BigInt(
				"0x0000000100000000000000000000000000000000000000000000000000000000"
			),
			"test",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"https://test.com/hat_image.png",
		]);

		let receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		let firstLevelHatId!: bigint;

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "HatCreated")
					firstLevelHatId = decodedLog.args.id;
			} catch (error) {}
		}

		// 階層のチェック TopHat => FirstLevel
		expect(await Hats.read.getHatLevel([firstLevelHatId])).equal(1);

		// FirstLevelHatの下に新しいHatを作成
		txHash = await Hats.write.createHat([
			firstLevelHatId,
			"test",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"https://test.com/hat_image.png",
		]);

		receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		let secondLevelHatId!: bigint;

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: Hats.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "HatCreated")
					secondLevelHatId = decodedLog.args.id;
			} catch (error) {}
		}

		// 階層のチェック TopHat => FirstLevel => SecondLevel
		expect(await Hats.read.getHatLevel([secondLevelHatId])).equal(2);
	});
});

describe("HatsModuleFactory", () => {
	let Hats: Hats;
	let HatsModuleFactory: HatsModuleFactory;

	let address1: WalletClient;

	let publicClient: PublicClient;

	before(async () => {
		const { Hats: _Hats } = await deployHatsProtocol();
		Hats = _Hats;

		const { HatsModuleFactory: _HatsModuleFactory } =
			await deployHatsModuleFactory(Hats.address);
		HatsModuleFactory = _HatsModuleFactory;

		[address1] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();
	});

	it("factory", async () => {
		const version = await HatsModuleFactory.read.version();

		expect(version).equal("0.0.1");
	});

	it("deploy module", async () => {
		const { HatsModule: HatsModuleImpl } = await deployEmptyHatsModule();

		await Hats.write.mintTopHat([
			address1.account?.address!,
			"Description",
			"https://test.com/tophat.png",
		]);

		const topHatId = BigInt(
			"0x0000000100000000000000000000000000000000000000000000000000000000"
		);

		const txHash = await HatsModuleFactory.write.createHatsModule([
			HatsModuleImpl.address,
			topHatId,
			"0x",
			"0x",
			BigInt(0),
		]);

		const receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		expect(
			await HatsModuleFactory.read.deployed([
				HatsModuleImpl.address,
				topHatId,
				"0x",
				BigInt(0),
			])
		).equal(true);

		const moduleAddress = await HatsModuleFactory.read.getHatsModuleAddress([
			HatsModuleImpl.address,
			topHatId,
			"0x",
			BigInt(0),
		]);

		const module = await viem.getContractAt("HatsModule", moduleAddress);

		expect((await module.read.IMPLEMENTATION()).toLowerCase()).equal(
			HatsModuleImpl.address
		);
	});
});
