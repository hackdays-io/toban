import { viem } from "hardhat";
import { expect } from "chai";
import {
	deploySplitsProtocol,
	PullSplitsFactory,
	PushSplitsFactory,
	SplitsWarehouse,
} from "../helpers/deploy/Splits";
import {
	Address,
	decodeEventLog,
	parseEther,
	PublicClient,
	WalletClient,
} from "viem";

describe("Splits", () => {
	let SplitsWarehouse: SplitsWarehouse;
	let PullSplitsFactory: PullSplitsFactory;
	let PushSplitsFactory: PushSplitsFactory;
	let DeployedPullSplit: Awaited<ReturnType<typeof getPullSplitContract>>;
	let address1: WalletClient;
	let address2: WalletClient;

	let publicClient: PublicClient;

	const getPullSplitContract = async (address: Address) => {
		return await viem.getContractAt("PullSplit", address);
	};

	before(async () => {
		const {
			SplitsWarehouse: _SplitsWarehouse,
			PullSplitsFactory: _PullSplitsFactory,
			PushSplitsFactory: _PushSplitsFactory,
		} = await deploySplitsProtocol();

		SplitsWarehouse = _SplitsWarehouse;
		PullSplitsFactory = _PullSplitsFactory;
		PushSplitsFactory = _PushSplitsFactory;

		[address1, address2] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();
	});

	it("should create PullSplits contract", async () => {
		// address1とaddress2に50%ずつ配分するSplitを作成
		const txHash = await PullSplitsFactory.write.createSplit([
			{
				recipients: [address1.account?.address!, address2.account?.address!],
				allocations: [50n, 50n],
				totalAllocation: 100n,
				distributionIncentive: 0,
			},
			address1.account?.address!,
			address1.account?.address!,
		]);

		const receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		let splitAddress!: Address;

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: PullSplitsFactory.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "SplitCreated")
					splitAddress = decodedLog.args.split;
			} catch (error) {}
		}

		DeployedPullSplit = await viem.getContractAt("PullSplit", splitAddress);
	});

	it("Should destribute", async () => {
		// Splitコントラクトに1ETH送金
		await address1.sendTransaction({
			account: address1.account!,
			to: DeployedPullSplit.address,
			value: parseEther("1"),
			chain: undefined,
		});

		const beforeAddress2Balance = await publicClient.getBalance({
			address: address2.account?.address!,
		});

		await DeployedPullSplit.write.distribute(
			[
				{
					recipients: [address1.account?.address!, address2.account?.address!],
					allocations: [50n, 50n],
					totalAllocation: 100n,
					distributionIncentive: 0,
				},
				"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
				address1.account?.address!,
			],
			{
				account: address1.account!,
			}
		);

		// withdrawを実行
		await SplitsWarehouse.write.withdraw(
			[
				address1.account?.address!,
				"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
			],
			{
				account: address1.account,
			}
		);

		await SplitsWarehouse.write.withdraw(
			[
				address2.account?.address as `0x${string}`,
				"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
			],
			{
				account: address2.account,
			}
		);

		const afterAddress2Balance = await publicClient.getBalance({
			address: address2.account?.address!,
		});

		// withdrawのガス代を引いて大体0.5ETH増えているはず
		expect(Number(afterAddress2Balance) - Number(beforeAddress2Balance)).gt(
			499900000000000000
		);
	});
});
