import { viem } from "hardhat";
import { expect } from "chai";
import { deployHatsProtocol, Hats } from "../helpers/deploy/Hats";
import { decodeEventLog, PublicClient, WalletClient } from "viem";

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
