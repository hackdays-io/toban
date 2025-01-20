import { expect } from "chai";
import { viem } from "hardhat";
import {
  type Address,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  parseEther,
  zeroAddress,
} from "viem";
import BigBangJson from "../artifacts/contracts/bigbang/BigBang.sol/BigBang.json";
import { type BigBang, deployBigBang } from "../helpers/deploy/BigBang";
import {
  type FractionToken,
  deployFractionToken,
} from "../helpers/deploy/FractionToken";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsTimeFrameModule,
} from "../helpers/deploy/Hats";
import {
  type PullSplitsFactory,
  type PushSplitsFactory,
  type SplitsCreator,
  type SplitsCreatorFactory,
  type SplitsWarehouse,
  deploySplitsCreator,
  deploySplitsCreatorFactory,
  deploySplitsProtocol,
} from "../helpers/deploy/Splits";

//store the HatsHatCreatorModule if needed
let HatsHatCreatorModuleByBigBang: any;

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

	// tore any newly deployed "PullSplit" contract
	let DeployedPullSplit: Awaited<ReturnType<typeof getPullSplitContract>>;

	// Hat IDs
	let topHatId: bigint;
	let hatterHatId: bigint;
	let hat1_id: bigint;
	let hat2_id: bigint;

	// Signers
	let deployer: WalletClient;
	let address1: WalletClient;
	let address2: WalletClient;
	let address3: WalletClient;

  let publicClient: PublicClient;

	// A helper to load "PullSplit" contract instance
	const getPullSplitContract = async (address: Address) => {
		return await viem.getContractAt("PullSplit", address);
	};

	// store "always-true" eligibility contract address
	let alwaysTrueAddress: Address;

	before(async () => {
		// 1) Deploy Hats Protocol
		const { Hats: _Hats } = await deployHatsProtocol();
		Hats = _Hats;

		// 2) Deploy HatsModuleFactory
		const { HatsModuleFactory: _HatsModuleFactory } =
			await deployHatsModuleFactory(Hats.address);
		HatsModuleFactory = _HatsModuleFactory;

		// 3) Deploy a time frame module impl
		const { HatsTimeFrameModule: _HatsTimeFrameModule } =
			await deployHatsTimeFrameModule();
		HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

		// 4) Deploy Splits protocol
		const {
			SplitsWarehouse: _SplitsWarehouse,
			PullSplitsFactory: _PullSplitsFactory,
			PushSplitsFactory: _PushSplitsFactory,
		} = await deploySplitsProtocol();
		SplitsWarehouse = _SplitsWarehouse;
		PullSplitsFactory = _PullSplitsFactory;
		PushSplitsFactory = _PushSplitsFactory;

		// 5) Deploy FractionToken
		const { FractionToken: _FractionToken } = await deployFractionToken(
			"",
			10000n,
			Hats.address
		);
		FractionToken = _FractionToken;

		// 6) Deploy SplitsCreator + SplitsCreatorFactory
		const { SplitsCreator: _SplitsCreator } = await deploySplitsCreator();
		SplitsCreator_IMPL = _SplitsCreator;

		const { SplitsCreatorFactory: _SplitsCreatorFactory } =
			await deploySplitsCreatorFactory(SplitsCreator_IMPL.address);
		SplitsCreatorFactory = _SplitsCreatorFactory;

		// 7) Grab signers
		[deployer, address1, address2, address3] = await viem.getWalletClients();

		// 8) Create a public client
		publicClient = await viem.getPublicClient();

		// 9) Deploy AlwaysTrueEligibility
		const alwaysTrueAbi = [
			{
				inputs: [],
				name: "getWearerStatus",
				outputs: [
					{ internalType: "uint256", name: "eligible", type: "uint256" },
					{ internalType: "uint256", name: "standing", type: "uint256" },
				],
				stateMutability: "pure",
				type: "function",
			},
		];
		// Minimal "always true" EVM bytecode
		const alwaysTrueBytecode =
			"0x6080604052348015600f57600080fd5b5060a88061001e6000396000f3fe608060405260043610602f5760003560e01c806385c2f695146034575b600080fd5b603a60383660046072565b50600090565b60405190815260200160405180910390f35bfea26469706673582212205f7cddb93c2050d0744708673ebf9212f6b50ec884ad9b444eb50951fa268a6364736f6c634300080e0033";

		const AlwaysTrueDeployment = await viem.deployContract({
			abi: alwaysTrueAbi,
			bytecode: alwaysTrueBytecode,
			account: deployer.account!,
		});
		alwaysTrueAddress = AlwaysTrueDeployment.contractAddress!;
	});

	it("should deploy BigBang", async () => {
		const { BigBang: _BigBang } = await deployBigBang({
			hatsContractAddress: Hats.address,
			hatsModuleFacotryAddress: HatsModuleFactory.address,
			hatsTimeFrameModule_impl: HatsTimeFrameModule_IMPL.address,
			hatsHatCreatorModule_impl: zeroAddress, // or some valid address
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
				deployer.account?.address!, // topHat owner
				"tophatDetails",
				"tophatURI",
				"hatterhatDetails",
				"hatterhatURI",
				alwaysTrueAddress, // eligibility
				alwaysTrueAddress, // toggle
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
						deployer.account?.address!.toLowerCase()
					);

					const hatsTimeFrameModuleAddress =
						decodedLog.args.hatsTimeFrameModule;
					const hatsHatCreatorModuleAddress =
						decodedLog.args.hatsHatCreatorModule;
					const splitsCreatorAddress = decodedLog.args.splitCreator;

          topHatId = decodedLog.args.topHatId;
          hatterHatId = decodedLog.args.hatterHatId;

					// retrieve via viem
					HatsTimeFrameModuleByBigBang = await viem.getContractAt(
						"HatsTimeFrameModule",
						hatsTimeFrameModuleAddress
					);
					HatsHatCreatorModuleByBigBang = await viem.getContractAt(
						"HatsHatCreatorModule",
						hatsHatCreatorModuleAddress
					);
					SplitsCreatorByBigBang = await viem.getContractAt(
						"SplitsCreator",
						splitsCreatorAddress
					);

					// check some function calls
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
		const txHash = await Hats.write.createHat([
			hatterHatId,
			"Role Hat",
			10,
			"0x0000000000000000000000000000000000004a75",
			"0x0000000000000000000000000000000000004a75",
			true,
			"",
		]);
		const receipt = await publicClient.waitForTransactionReceipt({
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
			0n,
		]);
		expect(
			await Hats.read.balanceOf([address1.account?.address!, hat1_id])
		).to.equal(1n);

		await HatsTimeFrameModuleByBigBang.write.mintHat([
			hat1_id,
			address2.account?.address!,
			0n,
		]);
		expect(
			await Hats.read.balanceOf([address2.account?.address!, hat1_id])
		).to.equal(1n);
	});

	it("should mint FractionToken", async () => {
		await FractionToken.write.mintInitialSupply([
			hat1_id,
			address1.account?.address!,
			0n,
		]);
		await FractionToken.write.mintInitialSupply([
			hat1_id,
			address2.account?.address!,
			0n,
		]);

		let balance1 = await FractionToken.read.balanceOf([
			address1.account?.address!,
			address1.account?.address!,
			hat1_id,
		]);
		expect(balance1).to.equal(10000n);

		let balance2 = await FractionToken.read.balanceOf([
			address2.account?.address!,
			address2.account?.address!,
			hat1_id,
		]);
		expect(balance2).to.equal(10000n);

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

		balance = await FractionToken.read.balanceOf([
			address1.account?.address!,
			address1.account?.address!,
			hat1_id,
		]);
		expect(balance).to.equal(9000n);

		balance = await FractionToken.read.balanceOf([
			address2.account?.address!,
			address2.account?.address!,
			hat1_id,
		]);
		expect(balance).to.equal(10000n);

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
        if (decodedLog.eventName == "SplitsCreated") {
          splitAddress = decodedLog.args.split;
          shareHolders = decodedLog.args.shareHolders;
          allocations = decodedLog.args.allocations;
          totalAllocation = decodedLog.args.totalAllocation;
        }
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
      },
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
