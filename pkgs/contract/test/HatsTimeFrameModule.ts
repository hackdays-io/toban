import { decodeEventLog, PublicClient, WalletClient } from "viem";
import {
	deployHatsModuleFactory,
	deployHatsProtocol,
	deployHatsTimeFrameModule,
	Hats,
	HatsModuleFactory,
	HatsTimeFrameModule,
} from "../helpers/deploy/Hats";
import { viem } from "hardhat";
import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("HatsTimeFrameModule", () => {
	let Hats: Hats;
	let HatsModuleFactory: HatsModuleFactory;
	let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
	let HatsTimeFrameModule: HatsTimeFrameModule;

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

		Hats = _Hats;
		HatsModuleFactory = _HatsModuleFactory;
		HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

		[address1, address2] = await viem.getWalletClients();

		await Hats.write.mintTopHat([
			address1.account?.address!,
			"Description",
			"https://test.com/tophat.png",
		]);

		topHatId = BigInt(
			"0x0000000100000000000000000000000000000000000000000000000000000000"
		);

		publicClient = await viem.getPublicClient();
	});

	it("deploy time frame module", async () => {
		// HatsModuleインスタンスをデプロイ
		await HatsModuleFactory.write.createHatsModule([
			HatsTimeFrameModule_IMPL.address,
			topHatId,
			"0x",
			"0x",
			BigInt(0),
		]);

		const moduleAddress = await HatsModuleFactory.read.getHatsModuleAddress([
			HatsTimeFrameModule_IMPL.address,
			topHatId,
			"0x",
			BigInt(0),
		]);

		HatsTimeFrameModule = await viem.getContractAt(
			"HatsTimeFrameModule",
			moduleAddress
		);

		expect(
			(await HatsTimeFrameModule.read.IMPLEMENTATION()).toLowerCase()
		).equal(HatsTimeFrameModule_IMPL.address);

		// Hatter Hatを作成
		let txHash = await Hats.write.createHat([
			topHatId,
			"",
			100,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"",
		]);
		let receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		let hatterHatId!: bigint;

		for (const log of receipt.logs) {
			const decodedLog = decodeEventLog({
				abi: Hats.abi,
				data: log.data,
				topics: log.topics,
			});
			if (decodedLog.eventName === "HatCreated") {
				hatterHatId = decodedLog.args.id;
			}
		}

		// Hatter HatをTimeFrameModuleにミント
		await Hats.write.mintHat([hatterHatId, HatsTimeFrameModule.address]);

		// Role hat をCreate
		txHash = await Hats.write.createHat([
			hatterHatId,
			"Role Hat",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"",
		]);

		receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		let roleHatId!: bigint;

		for (const log of receipt.logs) {
			const decodedLog = decodeEventLog({
				abi: Hats.abi,
				data: log.data,
				topics: log.topics,
			});
			if (decodedLog.eventName === "HatCreated") {
				roleHatId = decodedLog.args.id;
			}
		}

		// アドレス1にRole hatをミント
		await HatsTimeFrameModule.write.mintHat([
			roleHatId,
			address1.account?.address!,
		]);

		expect(
			await Hats.read.balanceOf([address1.account?.address!, roleHatId])
		).equal(BigInt(1));

		expect(
			await HatsTimeFrameModule.read.getWoreTime([
				address1.account?.address!,
				roleHatId,
			])
		).equal(BigInt(await time.latest()));

		await time.increase(100);

		expect(
			await HatsTimeFrameModule.read.getWearingElapsedTime([
				address1.account?.address!,
				roleHatId,
			])
		).equal(BigInt(100));
		
		// Fast forward time and check elapsed time while active
		await time.increase(100);

		let elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
			address1.account?.address!,
			roleHatId
		]);
		expect(
			elapsedTime
		).to.equal(BigInt(100));

		// Deactivate and verify that time stops accumulating
		await HatsTimeFrameModule.write.deactivate([
			roleHatId,
			address1.account?.address!
		]);

		await time.increase(50);

		elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
			address1.account?.address!,
			roleHatId
		]);
		expect(
			elapsedTime
		).to.equal(BigInt(100)); // Time should not increase

		// Reactivate and ensure time starts accumulating again
		await HatsTimeFrameModule.write.reactivate([
			roleHatId,
			address1.account?.address!
		]);

		await time.increase(100);

		elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
			address1.account?.address!,
			roleHatId
		]);
		expect(
			elapsedTime
		).to.equal(BigInt(200)); // Total time should now be 200
	});
});