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
  type ThanksToken,
  type ThanksTokenFactory,
  deployThanksToken,
  deployThanksTokenFactory,
} from "../helpers/deploy/ThanksToken";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  type HatsHatCreatorModule,
  type HatsFractionTokenModule,
  deployHatsHatCreatorModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsTimeFrameModule,
  deployHatsFractionTokenModule,
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
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";

describe("IntegrationTest", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsHatCreatorModule_IMPL: HatsHatCreatorModule;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitsFactory;
  let PushSplitsFactory: PushSplitsFactory;
  let SplitsCreatorFactory: SplitsCreatorFactory;
  let SplitsCreator_IMPL: SplitsCreator;
  let ThanksToken_IMPL: ThanksToken;
  let ThanksTokenFactory: ThanksTokenFactory;
  let BigBang: BigBang;
  let HatsTimeFrameModuleByBigBang: HatsTimeFrameModule;
  let HatsHatCreatorModuleByBigBang: HatsHatCreatorModule;
  let HatsFractionTokenModuleByBigBang: HatsFractionTokenModule;
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
    [deployer, address1, address2, address3] = await viem.getWalletClients();
    publicClient = await viem.getPublicClient();

    const { Create2Deployer: _Create2Deployer } = await deployCreate2Deployer();
    Create2Deployer = _Create2Deployer;

    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    const { HatsModuleFactory: _HatsModuleFactory } =
      await deployHatsModuleFactory(Hats.address);
    HatsModuleFactory = _HatsModuleFactory;

    const { HatsTimeFrameModule: _HatsTimeFrameModule } =
      await deployHatsTimeFrameModule("0.0.0", Create2Deployer.address);
    HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

    const { HatsHatCreatorModule: _HatsHatCreatorModule } =
      await deployHatsHatCreatorModule("0.0.0", Create2Deployer.address);
    HatsHatCreatorModule_IMPL = _HatsHatCreatorModule;

    const { HatsFractionTokenModule: _HatsFractionTokenModule_IMPL } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address);
    HatsFractionTokenModule_IMPL = _HatsFractionTokenModule_IMPL;

    const {
      SplitsWarehouse: _SplitsWarehouse,
      PullSplitsFactory: _PullSplitsFactory,
      PushSplitsFactory: _PushSplitsFactory,
    } = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

    const { ThanksToken: _ThanksToken } = await deployThanksToken(
      {
        initialOwner: await deployer
          .getAddresses()
          .then((addresses) => addresses[0]),
        name: "Test Thanks Token",
        symbol: "TTT",
        hatsAddress: Hats.address,
        fractionTokenAddress: HatsFractionTokenModule_IMPL.address,
        hatsTimeFrameModuleAddress: HatsTimeFrameModule_IMPL.address,
        defaultCoefficient: 1000000000000000000n, // 1.0 in wei
      },
      Create2Deployer.address,
    );
    ThanksToken_IMPL = _ThanksToken;

    const { ThanksTokenFactory: _ThanksTokenFactory } =
      await deployThanksTokenFactory(
        {
          initialOwner: await deployer
            .getAddresses()
            .then((addresses) => addresses[0]),
          implementation: ThanksToken_IMPL.address,
          hatsAddress: Hats.address,
          fractionTokenAddress: HatsFractionTokenModule_IMPL.address,
          hatsTimeFrameModuleAddress: HatsTimeFrameModule_IMPL.address,
        },
        Create2Deployer.address,
      );
    ThanksTokenFactory = _ThanksTokenFactory;

    const { SplitsCreator: _SplitsCreator } = await deploySplitsCreator(
      Create2Deployer.address,
    );
    SplitsCreator_IMPL = _SplitsCreator;

    const { SplitsCreatorFactory: _SplitsCreatorFactory } =
      await deploySplitsCreatorFactory(
        SplitsCreator_IMPL.address,
        Create2Deployer.address,
      );

    SplitsCreatorFactory = _SplitsCreatorFactory;
  });

  it("should deploy BigBang", async () => {
    const { BigBang: _BigBang } = await deployBigBang(
      {
        hatsContractAddress: Hats.address,
        hatsModuleFacotryAddress: HatsModuleFactory.address,
        hatsTimeFrameModule_impl: HatsTimeFrameModule_IMPL.address,
        hatsHatCreatorModule_impl: HatsHatCreatorModule_IMPL.address,
        hatsFractionTokenModule_impl: HatsFractionTokenModule_IMPL.address,
        splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
        splitsFactoryV2Address: PullSplitsFactory.address,
        thanksTokenFactoryAddress: ThanksTokenFactory.address,
      },
      Create2Deployer.address,
    );

    expect(_BigBang.address).to.not.be.undefined;

    BigBang = _BigBang;
  });

  it("should execute bigbang", async () => {
    await SplitsCreatorFactory.write.setBigBang([BigBang.address]);

    // ThanksTokenFactoryにBigBangアドレスをセット
    await ThanksTokenFactory.write.setBigBang([BigBang.address]);

    const txHash = await BigBang.write.bigbang(
      [
        deployer.account?.address!,
        "tophatDetails",
        "tophatURI",
        "hatterhatDetails",
        "hatterhatURI",
      ],
      { account: deployer.account },
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
            deployer.account?.address!,
          );

          const hatsTimeFrameModuleAddress =
            decodedLog.args.hatsTimeFrameModule;
          const hatsHatCreatorModuleAddress =
            decodedLog.args.hatsHatCreatorModule;
          const hatsFractionTokenModuleAddress =
            decodedLog.args.hatsFractionTokenModule;
          const splitsCreatorAddress = decodedLog.args.splitCreator;

          topHatId = decodedLog.args.topHatId;
          hatterHatId = decodedLog.args.hatterHatId;

          HatsTimeFrameModuleByBigBang = await viem.getContractAt(
            "HatsTimeFrameModule",
            hatsTimeFrameModuleAddress,
          );
          HatsHatCreatorModuleByBigBang = await viem.getContractAt(
            "HatsHatCreatorModule",
            hatsHatCreatorModuleAddress,
          );
          HatsFractionTokenModuleByBigBang = await viem.getContractAt(
            "HatsFractionTokenModule",
            hatsFractionTokenModuleAddress,
          );

          SplitsCreatorByBigBang = await viem.getContractAt(
            "SplitsCreator",
            splitsCreatorAddress,
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
    const txHash = await HatsHatCreatorModuleByBigBang.write.createHat([
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
      await Hats.read.balanceOf([address1.account?.address!, hat1_id]),
    ).equal(BigInt(1));

    await HatsTimeFrameModuleByBigBang.write.mintHat([
      hat1_id,
      address2.account?.address!,
      0n,
    ]);

    expect(
      await Hats.read.balanceOf([address2.account?.address!, hat1_id]),
    ).equal(BigInt(1));
  });

  it("should mint FractionToken", async () => {
    // address1,address2にtokenをmint
    await HatsFractionTokenModuleByBigBang.write.mintInitialSupply([
      hat1_id,
      address1.account?.address!,
      0n,
    ]);
    await HatsFractionTokenModuleByBigBang.write.mintInitialSupply([
      hat1_id,
      address2.account?.address!,
      0n,
    ]);

    // Check balance for address1
    const tokenId1 = await HatsFractionTokenModuleByBigBang.read.getTokenId([
      hat1_id,
      address1.account?.address!,
    ]);
    const balance1 = await HatsFractionTokenModuleByBigBang.read.balanceOf([
      address1.account?.address!,
      tokenId1,
    ]);
    expect(balance1).to.equal(10000n);

    // Check balance for address2
    const tokenId2 = await HatsFractionTokenModuleByBigBang.read.getTokenId([
      hat1_id,
      address2.account?.address!,
    ]);
    const balance2 = await HatsFractionTokenModuleByBigBang.read.balanceOf([
      address2.account?.address!,
      tokenId2,
    ]);
    expect(balance2).to.equal(10000n);

    // Check that address3 has no balance yet
    const balance3 = await HatsFractionTokenModuleByBigBang.read.balanceOf([
      address3.account?.address!,
      tokenId1,
    ]);
    expect(balance3).to.equal(0n);
  });

  it("should transfer and burn tokens", async () => {
    const tokenId = await HatsFractionTokenModuleByBigBang.read.getTokenId([
      hat1_id,
      address1.account?.address!,
    ]);

    // address1のtokenの一部をaddress3に移動
    await HatsFractionTokenModuleByBigBang.write.safeTransferFrom(
      [
        address1.account?.address!,
        address3.account?.address!,
        tokenId,
        1000n,
        "0x",
      ],
      {
        account: address1.account!,
      },
    );

    let balance: bigint;

    // address1のbalance
    balance = await HatsFractionTokenModuleByBigBang.read.balanceOf([
      address1.account?.address!,
      tokenId,
    ]);
    expect(balance).to.equal(9000n);

    // address2のbalance
    const tokenId2 = await HatsFractionTokenModuleByBigBang.read.getTokenId([
      hat1_id,
      address2.account?.address!,
    ]);
    balance = await HatsFractionTokenModuleByBigBang.read.balanceOf([
      address2.account?.address!,
      tokenId2,
    ]);
    expect(balance).to.equal(10000n);

    // address3のbalance
    balance = await HatsFractionTokenModuleByBigBang.read.balanceOf([
      address3.account?.address!,
      tokenId,
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
      },
    );

    await SplitsWarehouse.write.withdraw(
      [
        address2.account?.address as `0x${string}`,
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      ],
      {
        account: address2.account,
      },
    );

    await SplitsWarehouse.write.withdraw(
      [
        address3.account?.address as `0x${string}`,
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      ],
      {
        account: address3.account,
      },
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
