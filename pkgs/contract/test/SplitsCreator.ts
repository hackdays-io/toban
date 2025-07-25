import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { viem } from "hardhat";
import {
  type Address,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  encodeAbiParameters,
  keccak256,
  parseEther,
  zeroAddress,
} from "viem";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  type HatsFractionTokenModule,
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
import { upgradeSplitsCreatorFacotry } from "../helpers/upgrade/splitsCreatorFactory";
import { sqrt } from "../helpers/util/sqrt";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";

const createHat = async (
  Hats: Hats,
  publicClient: PublicClient,
  topHatId: bigint,
  roleName: string,
): Promise<bigint> => {
  let txHash = await Hats.write.createHat([
    topHatId,
    roleName,
    100,
    "0x0000000000000000000000000000000000004a75",
    "0x0000000000000000000000000000000000004a75",
    true,
    "",
  ]);
  let receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });

  let hatId: bigint | undefined = undefined;
  for (const log of receipt.logs) {
    const decodedLog = decodeEventLog({
      abi: Hats.abi,
      data: log.data,
      topics: log.topics,
    });
    if (decodedLog.eventName === "HatCreated") {
      hatId = decodedLog.args.id;
    }
  }

  if (!hatId) {
    throw new Error("Hatter hat ID not found in transaction logs");
  }
  return hatId as bigint;
};

describe("SplitsCreator Factory", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsTimeFrameModule: HatsTimeFrameModule;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let HatsFractionTokenModule: HatsFractionTokenModule;
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitsFactory;
  let PushSplitsFactory: PushSplitsFactory;
  let SplitsCreatorFactory: SplitsCreatorFactory;
  let SplitsCreator_IMPL: SplitsCreator;
  let SplitsCreator: SplitsCreator;

  let address1: WalletClient;
  let bigBangAddress: WalletClient;
  let newImplementation: WalletClient;

  let topHatId: bigint;

  before(async () => {
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

    const {
      SplitsWarehouse: _SplitsWarehouse,
      PullSplitsFactory: _PullSplitsFactory,
      PushSplitsFactory: _PushSplitsFactory,
    } = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

    const { SplitsCreator: _SplitsCreator } = await deploySplitsCreator(
      Create2Deployer.address,
    );
    SplitsCreator_IMPL = _SplitsCreator;

    [address1, bigBangAddress, newImplementation] =
      await viem.getWalletClients();

    await Hats.write.mintTopHat([
      address1.account?.address!,
      "Description",
      "https://test.com/tophat.png",
    ]);

    let publicClient = await viem.getPublicClient();

    topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );
    // Operator Tobanを作成
    let operatorTobanId = await createHat(
      Hats,
      publicClient,
      topHatId,
      "OperatorToban",
    );
    let timeFrameTobanId = await createHat(
      Hats,
      publicClient,
      operatorTobanId,
      "TimeFrameToban",
    );

    const { HatsFractionTokenModule: _HatsFractionTokenModule_IMPL } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address);
    HatsFractionTokenModule_IMPL = _HatsFractionTokenModule_IMPL;

    const timeFrameInitData = encodeAbiParameters(
      [{ type: "uint256" }],
      [timeFrameTobanId],
    );

    await HatsModuleFactory.write.createHatsModule([
      HatsTimeFrameModule_IMPL.address,
      topHatId,
      "0x",
      timeFrameInitData,
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
      hatsTimeFrameModuleAddress,
    );

    // Deploy HatsFractionTokenModule
    const fractionTokenInitData = encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }],
      ["https://example.com/fraction-token", 10000n],
    );

    await HatsModuleFactory.write.createHatsModule([
      HatsFractionTokenModule_IMPL.address,
      topHatId,
      "0x",
      fractionTokenInitData,
      BigInt(1),
    ]);

    const hatsFractionTokenModuleAddress =
      await HatsModuleFactory.read.getHatsModuleAddress([
        HatsFractionTokenModule_IMPL.address,
        topHatId,
        "0x",
        BigInt(1),
      ]);

    HatsFractionTokenModule = await viem.getContractAt(
      "HatsFractionTokenModule",
      hatsFractionTokenModuleAddress,
    );
  });

  it("Should deploy SplitsCreatorFactory", async () => {
    const { SplitsCreatorFactory: _SplitsCreatorFactory } =
      await deploySplitsCreatorFactory(
        SplitsCreator_IMPL.address,
        Create2Deployer.address,
      );

    SplitsCreatorFactory = _SplitsCreatorFactory;

    expect(SplitsCreatorFactory.address).to.be.a("string");
    expect(
      await SplitsCreatorFactory.read.predictDeterministicAddress([
        topHatId,

        Hats.address,
        PullSplitsFactory.address,
        HatsTimeFrameModule.address,
        HatsFractionTokenModule.address,
        keccak256("0x1234"),
      ]),
    ).to.be.a("string");
  });

  it("should set BigBang Address", async () => {
    await SplitsCreatorFactory.write.setBigBang([
      bigBangAddress.account?.address!,
    ]);
  });

  it("Should deploy SplitsCreator", async () => {
    const predictedAddress =
      await SplitsCreatorFactory.read.predictDeterministicAddress([
        topHatId,
        Hats.address,
        PullSplitsFactory.address,
        HatsTimeFrameModule.address,
        HatsFractionTokenModule.address,
        keccak256("0x1234"),
      ]);

    await SplitsCreatorFactory.write.createSplitCreatorDeterministic(
      [
        topHatId,
        Hats.address,
        PullSplitsFactory.address,
        HatsTimeFrameModule.address,
        HatsFractionTokenModule.address,
        keccak256("0x1234"),
      ],
      { account: bigBangAddress.account },
    );

    SplitsCreator = await viem.getContractAt("SplitsCreator", predictedAddress);

    expect(
      (await SplitsCreator.read.HATS_TIME_FRAME_MODULE()).toLowerCase(),
    ).equal(HatsTimeFrameModule.address.toLowerCase());
    expect((await SplitsCreator.read.FRACTION_TOKEN()).toLowerCase()).equal(
      HatsFractionTokenModule.address.toLowerCase(),
    );
  });

  it("should change SplitsCreator implementation address", async () => {
    await SplitsCreatorFactory.write.setImplementation([
      newImplementation.account?.address!,
    ]);
    expect(
      (
        await SplitsCreatorFactory.read.SPLITS_CREATOR_IMPLEMENTATION()
      ).toLocaleLowerCase(),
    ).to.equal(newImplementation.account?.address!);
  });

  it("sohuld upgrade SplitsCreatorFactory", async () => {
    const { UpgradedSplitsCreatorFactory: newSplitsCreatorFactory } =
      await upgradeSplitsCreatorFacotry(
        SplitsCreatorFactory.address,
        "SplitsCreatorFactory_Mock_v2",
        Create2Deployer.address,
      );

    /**
     * upgrade後にしかないメソッドを実行
     */
    expect(await newSplitsCreatorFactory.read.testUpgradeFunction()).to.equal(
      "testUpgradeFunction",
    );
  });
});

describe("CreateSplit", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsTimeFrameModule: HatsTimeFrameModule;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let HatsFractionTokenModule: HatsFractionTokenModule;
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitsFactory;
  let PushSplitsFactory: PushSplitsFactory;
  let SplitsCreatorFactory: SplitsCreatorFactory;
  let SplitsCreator_IMPL: SplitsCreator;
  let SplitsCreator: SplitsCreator;

  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let address4: WalletClient;
  let bigBangAddress: WalletClient;

  let topHatId: bigint;
  let hatterHatId: bigint;
  let hat1_id: bigint;
  let hat2_id: bigint;

  let address1WoreTime: bigint;
  let address2WoreTime: bigint;
  let address3WoreTime: bigint;
  const address1_additional_woreTime = 2592000;

  let publicClient: PublicClient;

  before(async () => {
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

    const {
      SplitsWarehouse: _SplitsWarehouse,
      PullSplitsFactory: _PullSplitsFactory,
      PushSplitsFactory: _PushSplitsFactory,
    } = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

    const { SplitsCreator: _SplitsCreator } = await deploySplitsCreator(
      Create2Deployer.address,
    );
    SplitsCreator_IMPL = _SplitsCreator;

    [address1, address2, address3, address4, bigBangAddress] =
      await viem.getWalletClients();

    publicClient = await viem.getPublicClient();

    let txHash = await Hats.write.mintTopHat([
      address1.account?.address!,
      "Description",
      "https://test.com/tophat.png",
    ]);

    // Wait for the transaction receipt
    let receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    // Extract the TopHat ID from the logs
    let topHatId: bigint | undefined = undefined;
    for (const log of receipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "HatCreated") {
          topHatId = decodedLog.args.id;
          break; // TopHat will be the first hat created
        }
      } catch (error) {
        // Handle any errors that occur during decoding
        console.error("Error decoding log:", error);
        throw error; // Continue to the next log if decoding fails
      }
    }

    // Operator Tobanを作成
    let operatorTobanId = await createHat(
      Hats,
      publicClient,
      topHatId!,
      "OperatorToban",
    );

    // Assign Operator Toban to address1
    await Hats.write.mintHat([operatorTobanId, address1.account?.address!]);

    let timeFrameTobanId = await createHat(
      Hats,
      publicClient,
      operatorTobanId,
      "TimeFrameToban",
    );

    const { HatsFractionTokenModule: _HatsFractionTokenModule_IMPL } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address);
    HatsFractionTokenModule_IMPL = _HatsFractionTokenModule_IMPL;

    const timeFrameInitData = encodeAbiParameters(
      [{ type: "uint256" }],
      [timeFrameTobanId],
    );

    await HatsModuleFactory.write.createHatsModule([
      HatsTimeFrameModule_IMPL.address,
      topHatId!,
      "0x",
      timeFrameInitData,
      BigInt(0),
    ]);

    const hatsTimeFrameModuleAddress =
      await HatsModuleFactory.read.getHatsModuleAddress([
        HatsTimeFrameModule_IMPL.address,
        topHatId!,
        "0x",
        BigInt(0),
      ]);

    HatsTimeFrameModule = await viem.getContractAt(
      "HatsTimeFrameModule",
      hatsTimeFrameModuleAddress,
    );

    // Deploy HatsFractionTokenModule
    const fractionTokenInitData = encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }],
      ["https://example.com/fraction-token", 10000n],
    );

    await HatsModuleFactory.write.createHatsModule([
      HatsFractionTokenModule_IMPL.address,
      topHatId!,
      "0x",
      fractionTokenInitData,
      BigInt(1),
    ]);

    const hatsFractionTokenModuleAddress =
      await HatsModuleFactory.read.getHatsModuleAddress([
        HatsFractionTokenModule_IMPL.address,
        topHatId!,
        "0x",
        BigInt(1),
      ]);

    HatsFractionTokenModule = await viem.getContractAt(
      "HatsFractionTokenModule",
      hatsFractionTokenModuleAddress,
    );

    const { SplitsCreatorFactory: _SplitsCreatorFactory } =
      await deploySplitsCreatorFactory(
        SplitsCreator_IMPL.address,
        Create2Deployer.address,
      );

    SplitsCreatorFactory = _SplitsCreatorFactory;

    await SplitsCreatorFactory.write.setBigBang([
      bigBangAddress.account?.address!,
    ]);

    txHash = await SplitsCreatorFactory.write.createSplitCreatorDeterministic(
      [
        topHatId!,
        Hats.address,
        PullSplitsFactory.address,
        HatsTimeFrameModule.address,
        hatsFractionTokenModuleAddress,
        keccak256("0x1234"),
      ],
      { account: bigBangAddress.account },
    );

    receipt = await publicClient.waitForTransactionReceipt({
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
            decodedLog.args.splitCreator,
          );
        }
      } catch (error) {}
    }

    txHash = await Hats.write.createHat([
      topHatId!,
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
      0n,
    ]);

    address1WoreTime = await publicClient
      .getBlock({
        blockTag: "latest",
      })
      .then((block) => block.timestamp);

    await time.increase(address1_additional_woreTime);

    await HatsTimeFrameModule.write.mintHat([
      hat1_id,
      address2.account?.address!,
      0n,
    ]);

    address2WoreTime = await publicClient
      .getBlock({
        blockTag: "latest",
      })
      .then((block) => block.timestamp);

    await HatsTimeFrameModule.write.mintHat([
      hat2_id,
      address3.account?.address!,
      0n,
    ]);

    address3WoreTime = await publicClient
      .getBlock({
        blockTag: "latest",
      })
      .then((block) => block.timestamp);

    await HatsFractionTokenModule.write.mintInitialSupply([
      hat1_id,
      address1.account?.address!,
      0n,
    ]);
    await HatsFractionTokenModule.write.mintInitialSupply([
      hat1_id,
      address2.account?.address!,
      0n,
    ]);
    await HatsFractionTokenModule.write.mintInitialSupply([
      hat2_id,
      address3.account?.address!,
      0n,
    ]);

    const tokenId = await HatsFractionTokenModule.read.getTokenId([
      hat1_id,
      address1.account?.address!,
    ]);
    await HatsFractionTokenModule.write.safeTransferFrom(
      [
        address1.account?.address!,
        address4.account?.address!,
        tokenId,
        3000n,
        "0x",
      ],
      {
        account: address1.account!,
      },
    );
    await HatsFractionTokenModule.write.safeTransferFrom(
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

    const address1Balance = await HatsFractionTokenModule.read.balanceOf([
      address1.account?.address!,
      tokenId,
    ]);
    expect(address1Balance).to.equal(6000n);

    // address2のbalance
    const address2TokenId = await HatsFractionTokenModule.read.getTokenId([
      hat1_id,
      address2.account?.address!,
    ]);
    const address2Balance = await HatsFractionTokenModule.read.balanceOf([
      address2.account?.address!,
      address2TokenId,
    ]);
    expect(address2Balance).to.equal(10000n);

    // address3のbalance
    const address3TokenId = await HatsFractionTokenModule.read.getTokenId([
      hat2_id,
      address3.account?.address!,
    ]);
    const address3Balance = await HatsFractionTokenModule.read.balanceOf([
      address3.account?.address!,
      address3TokenId,
    ]);
    expect(address3Balance).to.equal(10000n);
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

    const endWoreTime = await publicClient
      .getBlock({
        blockTag: "latest",
      })
      .then((block) => block.timestamp);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    let splitAddress!: Address;
    let shareHolders!: readonly Address[];
    let allocations!: readonly bigint[];
    let totalAllocation!: bigint;

    for (const log of receipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: SplitsCreator.abi,
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

    expect(shareHolders.length).to.equal(5);

    const address1Time = endWoreTime - address1WoreTime;
    const address2Time = endWoreTime - address2WoreTime;
    const address3Time = endWoreTime - address3WoreTime;

    const sqrtAddress1Time = sqrt(address1Time);
    const sqrtAddress2Time = sqrt(address2Time);
    const sqrtAddress3Time = sqrt(address3Time);

    const address1TokenId = await HatsFractionTokenModule.read.getTokenId([
      hat1_id,
      address1.account?.address!,
    ]);
    const address1Balance = await HatsFractionTokenModule.read.balanceOf([
      address1.account?.address!,
      address1TokenId,
    ]);
    expect(address1Balance).to.equal(6000n);

    const address3_address1Balance =
      await HatsFractionTokenModule.read.balanceOf([
        address3.account?.address!,
        address1TokenId,
      ]);

    const address4Balance = await HatsFractionTokenModule.read.balanceOf([
      address4.account?.address!,
      address1TokenId,
    ]);

    const address2TokenId = await HatsFractionTokenModule.read.getTokenId([
      hat1_id,
      address2.account?.address!,
    ]);
    const address2Balance = await HatsFractionTokenModule.read.balanceOf([
      address2.account?.address!,
      address2TokenId,
    ]);
    expect(address2Balance).to.equal(10000n);

    const address3TokenId = await HatsFractionTokenModule.read.getTokenId([
      hat2_id,
      address3.account?.address!,
    ]);
    const address3Balance = await HatsFractionTokenModule.read.balanceOf([
      address3.account?.address!,
      address3TokenId,
    ]);
    expect(address3Balance).to.equal(10000n);

    expect(allocations.length).to.equal(5);
    expect(allocations[0]).to.equal(
      ((address1Balance * 1000000n) / 20000n) * 1n * sqrtAddress1Time,
    );
    expect(allocations[1]).to.equal(
      ((address4Balance * 1000000n) / 20000n) * 1n * sqrtAddress1Time,
    );
    expect(allocations[2]).to.equal(
      ((address3_address1Balance * 1000000n) / 20000n) * 1n * sqrtAddress1Time,
    );
    expect(allocations[3]).to.equal(
      ((address2Balance * 1000000n) / 20000n) * 1n * sqrtAddress2Time,
    );
    expect(allocations[4]).to.equal(
      ((address3Balance * 1000000n) / 10000n) * 2n * sqrtAddress3Time,
    );

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
        recipients: shareHolders,
        allocations: allocations,
        totalAllocation: totalAllocation,
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
      },
    );
    await SplitsWarehouse.write.withdraw(
      [
        address2.account?.address!,
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      ],
      {
        account: address2.account!,
      },
    );
    await SplitsWarehouse.write.withdraw(
      [
        address3.account?.address!,
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      ],
      {
        account: address3.account!,
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

    expect(Number(afterAddress1Balance) - Number(beforeAddress1Balance)).gt(
      500,
    );
    expect(Number(afterAddress2Balance) - Number(beforeAddress2Balance)).gt(
      249,
    );
    expect(Number(afterAddress3Balance) - Number(beforeAddress3Balance)).gt(
      249,
    );
  });

  it("should preview allocations correctly", async () => {
    const splitsInfo = [
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
    ];

    const previewResult = await SplitsCreator.read.preview([splitsInfo]);

    const shareHolders = previewResult[0];
    const allocations = previewResult[1];
    const totalAllocation = previewResult[2];

    const endWoreTime = await publicClient
      .getBlock({
        blockTag: "latest",
      })
      .then((block) => block.timestamp);

    const address1Time = BigInt(endWoreTime - address1WoreTime);
    const address2Time = BigInt(endWoreTime - address2WoreTime);
    const address3Time = BigInt(endWoreTime - address3WoreTime);

    const sqrtAddress1Time = sqrt(address1Time);
    const sqrtAddress2Time = sqrt(address2Time);
    const sqrtAddress3Time = sqrt(address3Time);

    const address1TokenId = await HatsFractionTokenModule.read.getTokenId([
      hat1_id,
      address1.account?.address!,
    ]);
    const address1Balance = await HatsFractionTokenModule.read.balanceOf([
      address1.account?.address!,
      address1TokenId,
    ]);

    const address4Balance = await HatsFractionTokenModule.read.balanceOf([
      address4.account?.address!,
      address1TokenId,
    ]);

    const address2TokenId = await HatsFractionTokenModule.read.getTokenId([
      hat1_id,
      address2.account?.address!,
    ]);
    const address2Balance = await HatsFractionTokenModule.read.balanceOf([
      address2.account?.address!,
      address2TokenId,
    ]);

    const address3TokenId = await HatsFractionTokenModule.read.getTokenId([
      hat2_id,
      address3.account?.address!,
    ]);
    const address3Balance = await HatsFractionTokenModule.read.balanceOf([
      address3.account?.address!,
      address3TokenId,
    ]);

    const allocation0 =
      ((address1Balance * 1000000n) / 20000n) * 1n * sqrtAddress1Time;
    const allocation1 =
      ((address4Balance * 1000000n) / 20000n) * 1n * sqrtAddress1Time;
    const allocation2 =
      ((address2Balance * 1000000n) / 20000n) * 1n * sqrtAddress2Time;
    const allocation3 =
      ((address3Balance * 1000000n) / 10000n) * 2n * sqrtAddress3Time;

    const expectedAllocations = [
      allocation0,
      allocation1,
      allocation2,
      allocation3,
    ];

    expect(shareHolders.length).to.equal(5);

    const expectedShareHolders = [
      address1.account?.address!,
      address4.account?.address!,
      address3.account?.address!,
      address2.account?.address!,
      address3.account?.address!,
    ];

    // Convert addresses to lowercase before comparing
    expect(shareHolders[0].toLowerCase()).to.equal(
      expectedShareHolders[0].toLowerCase(),
    );
    expect(shareHolders[1].toLowerCase()).to.equal(
      expectedShareHolders[1].toLowerCase(),
    );
    expect(shareHolders[2].toLowerCase()).to.equal(
      expectedShareHolders[2].toLowerCase(),
    );
    expect(shareHolders[3].toLowerCase()).to.equal(
      expectedShareHolders[3].toLowerCase(),
    );
    expect(shareHolders[4].toLowerCase()).to.equal(
      expectedShareHolders[4].toLowerCase(),
    );

    expect(allocations.length).to.equal(5);

    expect(allocations[0]).to.equal(expectedAllocations[0]);
    expect(allocations[1]).to.equal(expectedAllocations[1]);
    expect(allocations[3]).to.equal(expectedAllocations[2]);
    expect(allocations[4]).to.equal(expectedAllocations[3]);
  });
});
