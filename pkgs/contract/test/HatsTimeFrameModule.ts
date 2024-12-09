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
	let roleHatId!: bigint;

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
	});

	it("mint hat", async () => {
		const initialTime = BigInt(await time.latest());

		await HatsTimeFrameModule.write.mintHat([
			roleHatId,
			address1.account?.address!,
			0n,
		]);

		const afterMintTime = BigInt(await time.latest());

		let woreTime = await HatsTimeFrameModule.read.getWoreTime([
			address1.account?.address!,
			roleHatId,
		]);

		expect(woreTime).to.equal(afterMintTime);

		await time.increaseTo(initialTime + 100n);

		const currentTime1 = BigInt(await time.latest());

		let expectedElapsedTime = currentTime1 - woreTime;

		let elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
			address1.account?.address!,
			roleHatId,
		]);

		expect(elapsedTime).to.equal(expectedElapsedTime);

		await time.increaseTo(initialTime + 200n);

		const currentTime2 = BigInt(await time.latest());

		expectedElapsedTime = currentTime2 - woreTime;

		elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
			address1.account?.address!,
			roleHatId,
		]);

		expect(elapsedTime).to.equal(expectedElapsedTime);

		await HatsTimeFrameModule.write.deactivate([
			roleHatId,
			address1.account?.address!,
		]);

		const afterDeactivateTime = BigInt(await time.latest());

		const totalActiveTimeAfterDeactivation = afterDeactivateTime - woreTime;

		expectedElapsedTime = totalActiveTimeAfterDeactivation;

		// Increase time to initialTime + 250 seconds (during inactivity)
		await time.increaseTo(initialTime + 250n);

		// Elapsed time should remain the same
		elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
			address1.account?.address!,
			roleHatId,
		]);

		expect(elapsedTime).to.equal(expectedElapsedTime);

		// Reactivate the hat
		await HatsTimeFrameModule.write.reactivate([
			roleHatId,
			address1.account?.address!,
		]);

		// Get woreTime after reactivation
		woreTime = BigInt(await time.latest());

		await time.increaseTo(initialTime + 350n);

		const currentTime3 = BigInt(await time.latest());

		expectedElapsedTime =
			totalActiveTimeAfterDeactivation + (currentTime3 - woreTime);

		elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
			address1.account?.address!,
			roleHatId,
		]);

		expect(elapsedTime).to.equal(expectedElapsedTime);
	});

	it("mint hat previous time", async () => {
		const initialTime = BigInt(await time.latest());
		await time.increaseTo(initialTime + 10000n);

		await HatsTimeFrameModule.write.mintHat([
			roleHatId,
			address2.account?.address!,
			initialTime + 5000n,
		]);

		const woreTime = await HatsTimeFrameModule.read.getWoreTime([
			address2.account?.address!,
			roleHatId,
		]);

		expect(woreTime).to.equal(initialTime + 5000n);
	});
});
