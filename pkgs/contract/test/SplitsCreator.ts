import {
	Address,
	decodeEventLog,
	formatEther,
	parseEther,
	PublicClient,
	WalletClient,
	zeroAddress,
} from "viem";
import {
	deployFractionToken,
	FractionToken,
} from "../helpers/deploy/FractionToken";
import { deployHatsProtocol, Hats } from "../helpers/deploy/Hats";
import {
	deploySplitsCreator,
	deploySplitsProtocol,
	PullSplitsFactory,
	PushSplitsFactory,
	SplitsCreator,
	SplitsWarehouse,
} from "../helpers/deploy/Splits";
import { viem } from "hardhat";
import { expect } from "chai";

describe("CreateSplit", () => {
	let Hats: Hats;
	let SplitsWarehouse: SplitsWarehouse;
	let PullSplitsFactory: PullSplitsFactory;
	let PushSplitsFactory: PushSplitsFactory;
	let SplitsCreator: SplitsCreator;
	let FractionToken: FractionToken;

	let address1: WalletClient;
	let address2: WalletClient;
	let address3: WalletClient;

	let hat1_id: bigint;
	let hat2_id: bigint;

	let publicClient: PublicClient;

	before(async () => {
		const { Hats: _Hats } = await deployHatsProtocol();
		Hats = _Hats;

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

		const { SplitsCreator: _SplitsCreator } = await deploySplitsCreator(
			PullSplitsFactory.address,
			FractionToken.address,
			zeroAddress
		);
		SplitsCreator = _SplitsCreator;

		[address1, address2, address3] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();

		await Hats.write.mintTopHat([
			address1.account?.address!,
			"Description",
			"https://test.com/tophat.png",
		]);

		let txHash = await Hats.write.createHat([
			BigInt(
				"0x0000000100000000000000000000000000000000000000000000000000000000"
			),
			"role1",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"https://test.com/hat_image.png",
		]);

		let receipt = await publicClient.waitForTransactionReceipt({
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
			BigInt(
				"0x0000000100000000000000000000000000000000000000000000000000000000"
			),
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

		// address1とaddress2にHatをmint
		await Hats.write.mintHat([hat1_id, address1.account?.address!]);
		await Hats.write.mintHat([hat2_id, address2.account?.address!]);

		// address1とaddress2にFractionTokenをmint
		await FractionToken.write.mint([hat1_id, address1.account?.address!]);
		await FractionToken.write.mint([hat2_id, address2.account?.address!]);

		const tokenId = await FractionToken.read.getTokenId([
			hat2_id,
			address2.account?.address!,
		]);

		await FractionToken.write.safeTransferFrom(
			[
				address2.account?.address!,
				address3.account?.address!,
				tokenId,
				5000n,
				"0x",
			],
			{
				account: address2.account!,
			}
		);
	});

	it("should create a split", async () => {
		const txHash = await SplitsCreator.write.create([
			[
				{
					hatId: hat2_id,
					wearers: [address2.account?.address!],
					multiplierBottom: 1n,
					multiplierTop: 1n,
				},
				{
					hatId: hat1_id,
					wearers: [address1.account?.address!],
					multiplierBottom: 1n,
					multiplierTop: 1n,
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
					address2.account?.address!,
					address3.account?.address!,
					address1.account?.address!,
				],
				allocations: [5000, 5000, 10000],
				totalAllocation: 20000,
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