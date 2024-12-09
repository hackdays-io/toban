import { expect } from "chai";
import { viem } from "hardhat";
import {
	Address,
	decodeEventLog,
	parseEther,
	PublicClient,
	WalletClient,
	zeroAddress,
} from "viem";
import BigBangJson from "../artifacts/contracts/bigbang/BigBang.sol/BigBang.json";
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

describe("IntegrationTest", () => {
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
	let HatsTimeFrameModuleByBigBang: HatsTimeFrameModule;
	let SplitsCreatorByBigBang: SplitsCreator;
	let DeployedPullSplit: Awaited<ReturnType<typeof getPullSplitContract>>;

	let topHatId: bigint;
	let hatterHatId: bigint;
	let hat1_id: bigint;
	let hat2_id: bigint;

	let deployer: WalletClient;
	let address1: WalletClient;
	let address2: WalletClient;
	let address3: WalletClient;

	let publicClient: PublicClient;

	const getPullSplitContract = async (address: Address) => {
		return await viem.getContractAt("PullSplit", address);
	};

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
			await deploySplitsCreatorFactory(zeroAddress, SplitsCreator_IMPL.address);

		SplitsCreatorFactory = _SplitsCreatorFactory;

		[deployer, address1, address2, address3] = await viem.getWalletClients();

		publicClient = await viem.getPublicClient();
	});

	it("should deploy BigBang", async () => {
		const { BigBang: _BigBang } = await deployBigBang({
			trustedForwarder: zeroAddress,
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
		SplitsCreatorFactory.write.setBigBang([BigBang.address]);

		const txHash = await BigBang.write.bigbang(
			[
				deployer.account?.address!,
				"tophatDetails",
				"tophatURI",
				"hatterhatDetails",
				"hatterhatURI",
				deployer.account?.address!,
			],
			{ account: deployer.account }
		);

		const receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			try {
				const decodedLog: any = decodeEventLog({
					abi: BigBangJson.abi,
					data: log.data,
					topics: log.topics,
				});

				if (decodedLog.eventName == "Executed") {
					expect(decodedLog.args.owner.toLowerCase()).to.be.equal(
						deployer.account?.address!
					);

					const hatsTimeFrameModuleAddress =
						decodedLog.args.hatsTimeFrameModule;
					const splitsCreatorAddress = decodedLog.args.splitCreator;

					topHatId = decodedLog.args.topHatId;
					hatterHatId = decodedLog.args.hatterHatId;

					HatsTimeFrameModuleByBigBang = await viem.getContractAt(
						"HatsTimeFrameModule",
						hatsTimeFrameModuleAddress
					);
					SplitsCreatorByBigBang = await viem.getContractAt(
						"SplitsCreator",
						splitsCreatorAddress
					);

					const getWoreTime =
						await HatsTimeFrameModuleByBigBang.read.getWoreTime([
							deployer.account?.address!,
							0n,
						]);

					expect(getWoreTime).to.equal(0n);

					const CheckHatsTimeFrameModule =
						await SplitsCreatorByBigBang.read.HATS_TIME_FRAME_MODULE();

					expect(CheckHatsTimeFrameModule).to.equal(hatsTimeFrameModuleAddress);
				}
			} catch (error) {}
		}
	});

	it("should create hat1", async () => {
		let txHash = await Hats.write.createHat([
			hatterHatId,
			"Role Hat",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"",
		]);

		let receipt = await publicClient.waitForTransactionReceipt({
			hash: txHash,
		});

		for (const log of receipt.logs) {
			const decodedLog = decodeEventLog({
				abi: Hats.abi,
				data: log.data,
				topics: log.topics,
			});
			if (decodedLog.eventName === "HatCreated") {
				hat1_id = decodedLog.args.id;
			}
		}
	});

	it("should mint hat1 to address1 and address2", async () => {
		await HatsTimeFrameModuleByBigBang.write.mintHat([
			hat1_id,
			address1.account?.address!,
		]);

		expect(
			await Hats.read.balanceOf([address1.account?.address!, hat1_id])
		).equal(BigInt(1));

		await HatsTimeFrameModuleByBigBang.write.mintHat([
			hat1_id,
			address2.account?.address!,
		]);

		expect(
			await Hats.read.balanceOf([address2.account?.address!, hat1_id])
		).equal(BigInt(1));
	});

	it("should mint FractionToken", async () => {
		// address1,address2にtokenをmint
		await FractionToken.write.mintInitialSupply([hat1_id, address1.account?.address!]);
		await FractionToken.write.mintInitialSupply([hat1_id, address2.account?.address!]);

		// Check balance for address1
		let balance1 = await FractionToken.read.balanceOf([
			address1.account?.address!,
			address1.account?.address!,
			hat1_id,
		]);
		expect(balance1).to.equal(10000n);

		// Check balance for address2
		let balance2 = await FractionToken.read.balanceOf([
			address2.account?.address!,
			address2.account?.address!,
			hat1_id,
		]);
		expect(balance2).to.equal(10000n);

		// Check that address3 has no balance yet
		let balance3 = await FractionToken.read.balanceOf([
			address3.account?.address!,
			address2.account?.address!,
			hat1_id,
		]);
		expect(balance3).to.equal(0n);
	});

	it("should transfer and burn tokens", async () => {
		const tokenId = await FractionToken.read.getTokenId([
			hat1_id,
			address1.account?.address!,
		]);

		// address2のtokenの半分をaddress3に移動
		await FractionToken.write.safeTransferFrom(
			[
				address1.account?.address!,
				address3.account?.address!,
				tokenId,
				1000n,
				"0x",
			],
			{
				account: address1.account!,
			}
		);

		let balance: bigint;

		// address1のbalance
		balance = await FractionToken.read.balanceOf([
			address1.account?.address!,
			address1.account?.address!,
			hat1_id,
		]);
		expect(balance).to.equal(9000n);

		// address2のbalance
		balance = await FractionToken.read.balanceOf([
			address2.account?.address!,
			address2.account?.address!,
			hat1_id,
		]);
		expect(balance).to.equal(10000n);

		// address3のbalance
		balance = await FractionToken.read.balanceOf([
			address3.account?.address!,
			address1.account?.address!,
			hat1_id,
		]);
		expect(balance).to.equal(1000n);
	});

	it("should create PullSplits contract", async () => {
		// address1とaddress2に50%ずつ配分するSplitを作成
		const tx = await SplitsCreatorByBigBang.write.create([
			[
				{
					hatId: hat1_id,
					wearers: [address1.account?.address!, address2.account?.address!],
					multiplierBottom: 1n,
					multiplierTop: 1n,
				},
			],
		]);

		const receipt = await publicClient.waitForTransactionReceipt({
			hash: tx,
		});

		let splitAddress!: Address;
		let shareHolders!: readonly Address[];
		let allocations!: readonly bigint[];
		let totalAllocation!: bigint;

		for (const log of receipt.logs) {
			try {
				const decodedLog = decodeEventLog({
					abi: SplitsCreatorByBigBang.abi,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "SplitsCreated")
					splitAddress = decodedLog.args.split;
				shareHolders = decodedLog.args.shareHolders;
				allocations = decodedLog.args.allocations;
				totalAllocation = decodedLog.args.totalAllocation;
			} catch (error) {
				shareHolders = [];
				allocations = [];
				totalAllocation = 0n;
			}
		}

		expect(shareHolders.length).to.equal(3);
		expect(allocations.length).to.equal(3);

		DeployedPullSplit = await viem.getContractAt("PullSplit", splitAddress);

		// Splitコントラクトに1ETH送金
		await deployer.sendTransaction({
			account: deployer.account!,
			to: DeployedPullSplit.address,
			value: parseEther("1"),
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

		expect(Number(beforeAddress1Balance))
			.gt(Number(parseEther("9999")))
			.lt(Number(parseEther("10001")));
		expect(Number(beforeAddress2Balance))
			.gt(Number(parseEther("9999")))
			.lt(Number(parseEther("10001")));
		expect(Number(beforeAddress3Balance))
			.gt(Number(parseEther("9999")))
			.lt(Number(parseEther("10001")));

		await DeployedPullSplit.write.distribute(
			[
				{
					recipients: shareHolders,
					allocations: allocations,
					totalAllocation: totalAllocation,
					distributionIncentive: 0,
				},
				"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
				deployer.account?.address!,
			],
			{
				account: deployer.account!,
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

		await SplitsWarehouse.write.withdraw(
			[
				address3.account?.address as `0x${string}`,
				"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
			],
			{
				account: address3.account,
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

		// withdrawのガス代を引いて大体0.45ETH増えているはず
		expect(Number(afterAddress1Balance) - Number(beforeAddress1Balance))
			.gt(449900000000000000)
			.lt(450100000000000000);

		// withdrawのガス代を引いて大体0.5ETH増えているはず
		expect(Number(afterAddress2Balance) - Number(beforeAddress2Balance))
			.gt(499900000000000000)
			.lt(500100000000000000);

		// 0.05ETH増えているはず
		expect(Number(afterAddress3Balance) - Number(beforeAddress3Balance))
			.gt(49900000000000000)
			.lt(50100000000000000);
	});
});
