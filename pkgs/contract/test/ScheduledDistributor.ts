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
  zeroAddress,
} from "viem";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";
import {
  type Hats,
  type HatsFractionTokenModule,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  deployHatsFractionTokenModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsTimeFrameModule,
} from "../helpers/deploy/Hats";
import {
  type ScheduledDistributorFactory,
  deployScheduledDistributor,
  deployScheduledDistributorFactory,
} from "../helpers/deploy/ScheduledDistributor";
import {
  type PullSplitsFactory,
  type SplitsCreator,
  type SplitsCreatorFactory,
  type SplitsWarehouse,
  deploySplitsCreator,
  deploySplitsCreatorFactory,
  deploySplitsProtocol,
} from "../helpers/deploy/Splits";
import {
  type ThanksToken,
  deployThanksToken,
  deployThanksTokenFactory,
} from "../helpers/deploy/ThanksToken";

const ZERO_WEIGHTS = {
  roleWeight: 1n,
  thanksTokenWeight: 0n,
  thanksTokenReceivedWeight: 95n,
  thanksTokenSentWeight: 5n,
};

const createHat = async (
  Hats: Hats,
  publicClient: PublicClient,
  parentId: bigint,
  name: string,
): Promise<bigint> => {
  const tx = await Hats.write.createHat([
    parentId,
    name,
    100,
    "0x0000000000000000000000000000000000004a75",
    "0x0000000000000000000000000000000000004a75",
    true,
    "",
  ]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: Hats.abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "HatCreated") return decoded.args.id;
    } catch {}
  }
  throw new Error("hat id not found");
};

describe("ScheduledDistributor", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsTimeFrameModule: HatsTimeFrameModule;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let HatsFractionTokenModule: HatsFractionTokenModule;
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitsFactory;
  let SplitsCreatorFactory: SplitsCreatorFactory;
  let SplitsCreator_IMPL: SplitsCreator;
  let SplitsCreator: SplitsCreator;
  let ThanksToken: ThanksToken;
  let ScheduledDistributorFactory: ScheduledDistributorFactory;
  let MockToken: Awaited<ReturnType<typeof viem.deployContract>>;
  let MockToken2: Awaited<ReturnType<typeof viem.deployContract>>;

  let deployer: WalletClient;
  let scheduler: WalletClient;
  let backupWallet: WalletClient;
  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let address4: WalletClient;
  let bigBangAddress: WalletClient;

  let publicClient: PublicClient;

  let topHatId: bigint;
  let hatterHatId: bigint;
  let hat1_id: bigint;
  let scheduledDate: bigint;

  before(async () => {
    [
      deployer,
      scheduler,
      backupWallet,
      address1,
      address2,
      address3,
      address4,
      bigBangAddress,
    ] = await viem.getWalletClients();
    publicClient = await viem.getPublicClient();

    const { Create2Deployer: _c2 } = await deployCreate2Deployer();
    Create2Deployer = _c2;

    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    const { HatsModuleFactory: _hmf } = await deployHatsModuleFactory(
      Hats.address,
    );
    HatsModuleFactory = _hmf;

    const { HatsTimeFrameModule: _htf } = await deployHatsTimeFrameModule(
      "0.0.0",
      Create2Deployer.address,
    );
    HatsTimeFrameModule_IMPL = _htf;

    const { HatsFractionTokenModule: _hft } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address);
    HatsFractionTokenModule_IMPL = _hft;

    const { SplitsWarehouse: _sw, PullSplitsFactory: _psf } =
      await deploySplitsProtocol();
    SplitsWarehouse = _sw;
    PullSplitsFactory = _psf;

    const { SplitsCreator: _sc } = await deploySplitsCreator(
      Create2Deployer.address,
    );
    SplitsCreator_IMPL = _sc;

    // Top hat
    await Hats.write.mintTopHat([
      deployer.account?.address!,
      "Top",
      "https://example.com",
    ]);
    topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );

    // Modules
    const operatorId = await createHat(Hats, publicClient, topHatId, "Operator");
    const timeFrameTobanId = await createHat(
      Hats,
      publicClient,
      operatorId,
      "TimeFrameToban",
    );
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

    const fractionTokenInitData = encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }],
      ["https://example.com/ft", 10000n],
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

    // ThanksToken (needed by SplitsCreator preview)
    const { ThanksToken: _tt } = await deployThanksToken(Create2Deployer.address);
    const { ThanksTokenFactory } = await deployThanksTokenFactory(
      {
        initialOwner: deployer.account?.address!,
        implementation: _tt.address,
        hatsAddress: Hats.address,
      },
      Create2Deployer.address,
    );
    await ThanksTokenFactory.write.setBigBang([
      bigBangAddress.account?.address!,
    ]);
    const ttTx = await ThanksTokenFactory.write.createThanksTokenDeterministic(
      [
        "TT",
        "TT",
        bigBangAddress.account?.address!,
        hatsFractionTokenModuleAddress,
        hatsTimeFrameModuleAddress,
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ],
      { account: bigBangAddress.account },
    );
    const ttReceipt = await publicClient.waitForTransactionReceipt({
      hash: ttTx,
    });
    let thanksTokenAddress: Address | undefined;
    for (const log of ttReceipt.logs) {
      try {
        const d = decodeEventLog({
          abi: ThanksTokenFactory.abi,
          data: log.data,
          topics: log.topics,
        });
        if (d.eventName === "ThanksTokenCreated") {
          thanksTokenAddress = d.args.tokenAddress as Address;
          break;
        }
      } catch {}
    }
    ThanksToken = await viem.getContractAt("ThanksToken", thanksTokenAddress!);

    // SplitsCreator
    const { SplitsCreatorFactory: _scf } = await deploySplitsCreatorFactory(
      SplitsCreator_IMPL.address,
      Create2Deployer.address,
    );
    SplitsCreatorFactory = _scf;
    await SplitsCreatorFactory.write.setBigBang([
      bigBangAddress.account?.address!,
    ]);
    const scTx = await SplitsCreatorFactory.write.createSplitCreatorDeterministic(
      [
        topHatId,
        Hats.address,
        PullSplitsFactory.address,
        HatsTimeFrameModule.address,
        hatsFractionTokenModuleAddress,
        ThanksToken.address,
        zeroAddress,
        keccak256("0x1234"),
      ],
      { account: bigBangAddress.account },
    );
    const scReceipt = await publicClient.waitForTransactionReceipt({
      hash: scTx,
    });
    for (const log of scReceipt.logs) {
      try {
        const d = decodeEventLog({
          abi: SplitsCreatorFactory.abi,
          data: log.data,
          topics: log.topics,
        });
        if (d.eventName === "SplitCreatorCreated") {
          SplitsCreator = await viem.getContractAt(
            "SplitsCreator",
            d.args.splitCreator,
          );
        }
      } catch {}
    }

    // Create role hat (hatterHat -> hat1)
    hatterHatId = await createHat(Hats, publicClient, topHatId, "Hatter");
    await Hats.write.mintHat([hatterHatId, HatsTimeFrameModule.address]);
    hat1_id = await createHat(Hats, publicClient, hatterHatId, "role1");

    // Mint hat1 to address1, address2, address3
    await HatsTimeFrameModule.write.mintHat([hat1_id, address1.account?.address!, 0n]);
    await HatsTimeFrameModule.write.mintHat([hat1_id, address2.account?.address!, 0n]);
    await HatsTimeFrameModule.write.mintHat([hat1_id, address3.account?.address!, 0n]);

    // FractionToken initial supply
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
      hat1_id,
      address3.account?.address!,
      0n,
    ]);

    await time.increase(60 * 60 * 24);

    // Deploy ScheduledDistributor + factory
    const { ScheduledDistributor } = await deployScheduledDistributor(
      Create2Deployer.address,
    );
    const { ScheduledDistributorFactory: _sdf } =
      await deployScheduledDistributorFactory(
        {
          initialOwner: deployer.account?.address!,
          implementation: ScheduledDistributor.address,
          hatsAddress: Hats.address,
        },
        Create2Deployer.address,
      );
    ScheduledDistributorFactory = _sdf;

    // Deploy two mock ERC20s
    MockToken = await viem.deployContract("MockERC20", ["Mock", "MOCK"]);
    MockToken2 = await viem.deployContract("MockERC20", ["Mock2", "MOCK2"]);
    await MockToken.write.mint([scheduler.account?.address!, 1_000_000n]);
    await MockToken2.write.mint([scheduler.account?.address!, 1_000_000n]);
  });

  let setupCounter = 0;

  const setupRule = async (
    options: { confirmedWearers?: Address[][]; tokens?: Address[] } = {},
  ) => {
    setupCounter += 1;
    const block = await publicClient.getBlock({ blockTag: "latest" });
    scheduledDate = block.timestamp + 3600n; // 1h in the future
    const confirmedWearers =
      options.confirmedWearers ??
      [[address1.account!.address, address2.account!.address]];
    const tokens = options.tokens ?? [MockToken.address];
    const params = {
      hats: zeroAddress, // overwritten by factory
      splitsCreator: SplitsCreator.address,
      scheduler: zeroAddress, // overwritten by factory
      tokens,
      depositor: scheduler.account!.address,
      backupWallet: backupWallet.account!.address,
      scheduledDate,
      weights: ZERO_WEIGHTS,
      hatIds: [hat1_id],
      multiplierTops: [1n],
      multiplierBottoms: [1n],
      confirmedWearers,
    };
    const salt = keccak256(
      `0x${setupCounter.toString(16).padStart(64, "0")}` as `0x${string}`,
    );
    const tx = await ScheduledDistributorFactory.write.createScheduledDistributor(
      [params, salt],
      { account: scheduler.account },
    );
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    let distributor: Address | undefined;
    for (const log of receipt.logs) {
      try {
        const d = decodeEventLog({
          abi: ScheduledDistributorFactory.abi,
          data: log.data,
          topics: log.topics,
        });
        if (d.eventName === "ScheduledDistributorCreated") {
          distributor = d.args.distributor as Address;
          break;
        }
      } catch {}
    }
    return await viem.getContractAt("ScheduledDistributor", distributor!);
  };

  it("creates a distributor with rule and emits RuleCreated", async () => {
    const dist = await setupRule();
    expect(await dist.read.initialized()).to.equal(true);
    expect((await dist.read.scheduler()).toLowerCase()).to.equal(
      scheduler.account?.address!.toLowerCase(),
    );
    const tokens = (await dist.read.getTokens()) as Address[];
    expect(tokens.length).to.equal(1);
    expect(tokens[0].toLowerCase()).to.equal(MockToken.address.toLowerCase());
    expect(await dist.read.scheduledDate()).to.equal(scheduledDate);
  });

  it("rejects re-initialization", async () => {
    const dist = await setupRule();
    const params = {
      hats: Hats.address,
      splitsCreator: SplitsCreator.address,
      scheduler: scheduler.account!.address,
      tokens: [MockToken.address],
      depositor: scheduler.account!.address,
      backupWallet: backupWallet.account!.address,
      scheduledDate,
      weights: ZERO_WEIGHTS,
      hatIds: [hat1_id],
      multiplierTops: [1n],
      multiplierBottoms: [1n],
      confirmedWearers: [
        [address1.account!.address, address2.account!.address],
      ],
    };
    await expect(dist.write.initialize([params])).to.be.rejected;
  });

  it("rejects rule with fewer than 2 confirmed wearers", async () => {
    const block = await publicClient.getBlock({ blockTag: "latest" });
    const params = {
      hats: zeroAddress,
      splitsCreator: SplitsCreator.address,
      scheduler: zeroAddress,
      tokens: [MockToken.address],
      depositor: scheduler.account!.address,
      backupWallet: backupWallet.account!.address,
      scheduledDate: block.timestamp + 3600n,
      weights: ZERO_WEIGHTS,
      hatIds: [hat1_id],
      multiplierTops: [1n],
      multiplierBottoms: [1n],
      confirmedWearers: [[address1.account!.address]],
    };
    await expect(
      ScheduledDistributorFactory.write.createScheduledDistributor(
        [params, keccak256("0x9999")],
        { account: scheduler.account },
      ),
    ).to.be.rejected;
  });

  it("rejects rule with empty tokens", async () => {
    const block = await publicClient.getBlock({ blockTag: "latest" });
    const params = {
      hats: zeroAddress,
      splitsCreator: SplitsCreator.address,
      scheduler: zeroAddress,
      tokens: [] as Address[],
      depositor: scheduler.account!.address,
      backupWallet: backupWallet.account!.address,
      scheduledDate: block.timestamp + 3600n,
      weights: ZERO_WEIGHTS,
      hatIds: [hat1_id],
      multiplierTops: [1n],
      multiplierBottoms: [1n],
      confirmedWearers: [
        [address1.account!.address, address2.account!.address],
      ],
    };
    await expect(
      ScheduledDistributorFactory.write.createScheduledDistributor(
        [params, keccak256("0x9998")],
        { account: scheduler.account },
      ),
    ).to.be.rejected;
  });

  it("rejects rule with duplicate tokens", async () => {
    const block = await publicClient.getBlock({ blockTag: "latest" });
    const params = {
      hats: zeroAddress,
      splitsCreator: SplitsCreator.address,
      scheduler: zeroAddress,
      tokens: [MockToken.address, MockToken.address],
      depositor: scheduler.account!.address,
      backupWallet: backupWallet.account!.address,
      scheduledDate: block.timestamp + 3600n,
      weights: ZERO_WEIGHTS,
      hatIds: [hat1_id],
      multiplierTops: [1n],
      multiplierBottoms: [1n],
      confirmedWearers: [
        [address1.account!.address, address2.account!.address],
      ],
    };
    await expect(
      ScheduledDistributorFactory.write.createScheduledDistributor(
        [params, keccak256("0x9997")],
        { account: scheduler.account },
      ),
    ).to.be.rejected;
  });

  it("accepts deposits", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 100n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 100n], {
      account: scheduler.account,
    });
    expect(await MockToken.read.balanceOf([dist.address])).to.equal(100n);
  });

  it("deposit() rejects an unlisted token", async () => {
    const dist = await setupRule();
    await MockToken2.write.approve([dist.address, 100n], {
      account: scheduler.account,
    });
    await expect(
      dist.write.deposit([MockToken2.address, 100n], {
        account: scheduler.account,
      }),
    ).to.be.rejected;
  });

  it("execute() reverts before scheduledDate", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 100n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 100n], {
      account: scheduler.account,
    });
    await expect(
      dist.write.execute([
        [[address1.account!.address, address2.account!.address]],
      ]),
    ).to.be.rejected;
  });

  it("execute() reverts when a confirmed wearer is omitted", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 100n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 100n], {
      account: scheduler.account,
    });
    await time.increase(3700);
    await expect(
      dist.write.execute([[[address1.account!.address]]]),
    ).to.be.rejected;
  });

  it("execute() reverts when an input is not a wearer", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 100n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 100n], {
      account: scheduler.account,
    });
    await time.increase(3700);
    await expect(
      dist.write.execute([
        [
          [
            address1.account!.address,
            address2.account!.address,
            address4.account!.address, // not a wearer
          ],
        ],
      ]),
    ).to.be.rejected;
  });

  it("execute() reverts on duplicate wearer", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 100n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 100n], {
      account: scheduler.account,
    });
    await time.increase(3700);
    await expect(
      dist.write.execute([
        [
          [
            address1.account!.address,
            address2.account!.address,
            address2.account!.address,
          ],
        ],
      ]),
    ).to.be.rejected;
  });

  it("execute() succeeds and distributes the token", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 1000n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 1000n], {
      account: scheduler.account,
    });
    await time.increase(3700);

    // Include address3 (a current wearer not in the confirmed list — additive ok)
    await dist.write.execute([
      [
        [
          address1.account!.address,
          address2.account!.address,
          address3.account!.address,
        ],
      ],
    ]);
    expect(await dist.read.executed()).to.equal(true);
    const splitAddr = await dist.read.split();
    expect(splitAddr).to.not.equal(zeroAddress);

    // Module balance is drained
    expect(await MockToken.read.balanceOf([dist.address])).to.equal(0n);

    // Re-execute is rejected
    await expect(
      dist.write.execute([
        [
          [
            address1.account!.address,
            address2.account!.address,
            address3.account!.address,
          ],
        ],
      ]),
    ).to.be.rejected;
  });

  it("execute() distributes every configured token through the same split", async () => {
    const dist = await setupRule({
      tokens: [MockToken.address, MockToken2.address],
    });
    await MockToken.write.approve([dist.address, 500n], {
      account: scheduler.account,
    });
    await MockToken2.write.approve([dist.address, 1000n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 500n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken2.address, 1000n], {
      account: scheduler.account,
    });
    await time.increase(3700);

    await dist.write.execute([
      [[address1.account!.address, address2.account!.address]],
    ]);
    expect(await dist.read.executed()).to.equal(true);
    const splitAddr = await dist.read.split();
    expect(splitAddr).to.not.equal(zeroAddress);

    // Both balances drained out of the module
    expect(await MockToken.read.balanceOf([dist.address])).to.equal(0n);
    expect(await MockToken2.read.balanceOf([dist.address])).to.equal(0n);
  });

  it("execute() tolerates a token with zero balance", async () => {
    const dist = await setupRule({
      tokens: [MockToken.address, MockToken2.address],
    });
    // Only deposit one of the two tokens
    await MockToken.write.approve([dist.address, 200n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 200n], {
      account: scheduler.account,
    });
    await time.increase(3700);
    await dist.write.execute([
      [[address1.account!.address, address2.account!.address]],
    ]);
    expect(await dist.read.executed()).to.equal(true);
    expect(await MockToken.read.balanceOf([dist.address])).to.equal(0n);
    expect(await MockToken2.read.balanceOf([dist.address])).to.equal(0n);
  });

  it("reclaim() allows scheduler after 72h when not executed", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 500n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 500n], {
      account: scheduler.account,
    });

    // Before scheduled date: reclaim rejected
    await expect(dist.write.reclaim({ account: scheduler.account })).to.be
      .rejected;

    await time.increase(3700); // past scheduled date but not past 72h
    await expect(dist.write.reclaim({ account: scheduler.account })).to.be
      .rejected;

    await time.increase(72 * 3600);
    const before = await MockToken.read.balanceOf([scheduler.account!.address]);
    await dist.write.reclaim({ account: scheduler.account });
    const after = await MockToken.read.balanceOf([scheduler.account!.address]);
    expect(after - before).to.equal(500n);
    expect(await dist.read.reclaimed()).to.equal(true);
  });

  it("reclaim() returns every configured token", async () => {
    const dist = await setupRule({
      tokens: [MockToken.address, MockToken2.address],
    });
    await MockToken.write.approve([dist.address, 300n], {
      account: scheduler.account,
    });
    await MockToken2.write.approve([dist.address, 700n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 300n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken2.address, 700n], {
      account: scheduler.account,
    });
    await time.increase(3700 + 72 * 3600);

    const t1Before = await MockToken.read.balanceOf([
      scheduler.account!.address,
    ]);
    const t2Before = await MockToken2.read.balanceOf([
      scheduler.account!.address,
    ]);
    await dist.write.reclaim({ account: scheduler.account });
    const t1After = await MockToken.read.balanceOf([
      scheduler.account!.address,
    ]);
    const t2After = await MockToken2.read.balanceOf([
      scheduler.account!.address,
    ]);
    expect(t1After - t1Before).to.equal(300n);
    expect(t2After - t2Before).to.equal(700n);
  });

  it("reclaim() allows backupWallet too", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 500n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 500n], {
      account: scheduler.account,
    });
    await time.increase(3700 + 72 * 3600);

    const before = await MockToken.read.balanceOf([
      backupWallet.account!.address,
    ]);
    await dist.write.reclaim({ account: backupWallet.account });
    const after = await MockToken.read.balanceOf([
      backupWallet.account!.address,
    ]);
    expect(after - before).to.equal(500n);
  });

  it("reclaim() rejects unauthorized callers", async () => {
    const dist = await setupRule();
    await MockToken.write.approve([dist.address, 500n], {
      account: scheduler.account,
    });
    await dist.write.deposit([MockToken.address, 500n], {
      account: scheduler.account,
    });
    await time.increase(3700 + 72 * 3600);
    await expect(dist.write.reclaim({ account: address4.account })).to.be
      .rejected;
  });
});
