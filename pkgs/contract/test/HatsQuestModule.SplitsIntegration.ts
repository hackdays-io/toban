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
  type Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";
import {
  type Hats,
  type HatsFractionTokenModule,
  type HatsModuleFactory,
  type HatsQuestModule,
  type HatsTimeFrameModule,
  deployHatsFractionTokenModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsQuestModule,
  deployHatsTimeFrameModule,
} from "../helpers/deploy/Hats";
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
  type ThanksTokenFactory,
  deployThanksToken,
  deployThanksTokenFactory,
} from "../helpers/deploy/ThanksToken";

/**
 * Verifies the SplitsCreator <-> HatsQuestModule integration:
 *  1. The quest module address is excluded from the recipients list.
 *  2. While shares are escrowed, the creator's preview score includes the
 *     escrowed amount.
 *  3. After completion the share moves to the submitter and the creator's
 *     score drops accordingly.
 *  4. After cancellation the escrow returns to the creator and the score
 *     matches the pre-escrow baseline.
 */
describe("HatsQuestModule + SplitsCreator integration", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsQuestModule_IMPL: HatsQuestModule;
  let HatsFractionTokenModule: HatsFractionTokenModule;
  let HatsTimeFrameModule: HatsTimeFrameModule;
  let HatsQuestModule: HatsQuestModule;
  let SplitsCreator_IMPL: SplitsCreator;
  let SplitsCreatorFactory: SplitsCreatorFactory;
  let SplitsCreator: SplitsCreator;
  let ThanksToken_IMPL: ThanksToken;
  let ThanksTokenFactory: ThanksTokenFactory;
  let ThanksToken: ThanksToken;
  let PullSplitsFactory: PullSplitsFactory;
  let SplitsWarehouse: SplitsWarehouse;

  let admin: WalletClient;
  let creator: WalletClient;
  let submitter: WalletClient;
  let bigBang: WalletClient;
  let publicClient: PublicClient;

  let adminAddr: Address;
  let creatorAddr: Address;
  let submitterAddr: Address;

  let topHatId: bigint;
  let workHatId: bigint;

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) throw new Error("missing account");
    return client.account.address;
  };

  const weightsInfo = {
    roleWeight: 1n,
    thanksTokenWeight: 0n,
    thanksTokenReceivedWeight: 1n,
    thanksTokenSentWeight: 1n,
  };

  const previewScores = async () => {
    const result = await SplitsCreator.read.preview([
      [
        {
          hatId: workHatId,
          wearers: [creatorAddr],
          multiplierBottom: 1n,
          multiplierTop: 1n,
        },
      ],
      weightsInfo,
    ]);
    const shareHolders = result[0] as readonly Address[];
    const allocations = result[1] as readonly bigint[];
    const map: Record<string, bigint> = {};
    for (let i = 0; i < shareHolders.length; i++) {
      const addr = shareHolders[i].toLowerCase();
      map[addr] = (map[addr] ?? 0n) + allocations[i];
    }
    return { shareHolders, allocations, map };
  };

  before(async () => {
    [admin, creator, submitter, bigBang] = await viem.getWalletClients();
    adminAddr = validateAddress(admin);
    creatorAddr = validateAddress(creator);
    submitterAddr = validateAddress(submitter);
    publicClient = await viem.getPublicClient();

    const { Create2Deployer: _Create2Deployer } = await deployCreate2Deployer();
    Create2Deployer = _Create2Deployer;

    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    const { HatsModuleFactory: _HMF } = await deployHatsModuleFactory(
      Hats.address,
    );
    HatsModuleFactory = _HMF;

    const { HatsTimeFrameModule: _tf } = await deployHatsTimeFrameModule(
      "0.0.0",
      Create2Deployer.address,
    );
    HatsTimeFrameModule_IMPL = _tf;

    const { HatsFractionTokenModule: _ft } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address);
    HatsFractionTokenModule_IMPL = _ft;

    const { HatsQuestModule: _q } = await deployHatsQuestModule(
      "0.0.0",
      Create2Deployer.address,
    );
    HatsQuestModule_IMPL = _q;

    const { SplitsCreator: _sc } = await deploySplitsCreator(
      Create2Deployer.address,
    );
    SplitsCreator_IMPL = _sc;

    const {
      SplitsWarehouse: _sw,
      PullSplitsFactory: _psf,
    } = await deploySplitsProtocol();
    SplitsWarehouse = _sw;
    PullSplitsFactory = _psf;

    const { ThanksToken: _tt } = await deployThanksToken(Create2Deployer.address);
    ThanksToken_IMPL = _tt;

    const { ThanksTokenFactory: _ttf } = await deployThanksTokenFactory(
      {
        initialOwner: adminAddr,
        implementation: ThanksToken_IMPL.address,
        hatsAddress: Hats.address,
      },
      Create2Deployer.address,
    );
    ThanksTokenFactory = _ttf;

    // ====== Hats setup ======
    await Hats.write.mintTopHat([adminAddr, "Workspace", "ipfs://workspace"]);
    topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );

    let txHash = await Hats.write.createHat([
      topHatId,
      "Hatter",
      100,
      "0x0000000000000000000000000000000000004A75",
      "0x0000000000000000000000000000000000004A75",
      true,
      "",
    ]);
    let receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    let hatterHatId: bigint | undefined;
    for (const log of receipt.logs) {
      const decoded = decodeEventLog({
        abi: Hats.abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "HatCreated") hatterHatId = decoded.args.id as bigint;
    }
    if (!hatterHatId) throw new Error("hatter hat not created");

    txHash = await Hats.write.createHat([
      hatterHatId,
      "Worker",
      100,
      "0x0000000000000000000000000000000000004A75",
      "0x0000000000000000000000000000000000004A75",
      true,
      "",
    ]);
    receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    for (const log of receipt.logs) {
      const decoded = decodeEventLog({
        abi: Hats.abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "HatCreated") workHatId = decoded.args.id as bigint;
    }

    // ====== Module clones ======
    const ftInitData = encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }],
      ["", 10_000n],
    );
    await HatsModuleFactory.write.createHatsModule([
      HatsFractionTokenModule_IMPL.address,
      topHatId,
      "0x",
      ftInitData,
      0n,
    ]);
    HatsFractionTokenModule = await viem.getContractAt(
      "HatsFractionTokenModule",
      (await HatsModuleFactory.read.getHatsModuleAddress([
        HatsFractionTokenModule_IMPL.address,
        topHatId,
        "0x",
        0n,
      ])) as Address,
    );

    const tfInitData = encodeAbiParameters([{ type: "uint256" }], [topHatId]);
    await HatsModuleFactory.write.createHatsModule([
      HatsTimeFrameModule_IMPL.address,
      topHatId,
      "0x",
      tfInitData,
      0n,
    ]);
    HatsTimeFrameModule = await viem.getContractAt(
      "HatsTimeFrameModule",
      (await HatsModuleFactory.read.getHatsModuleAddress([
        HatsTimeFrameModule_IMPL.address,
        topHatId,
        "0x",
        0n,
      ])) as Address,
    );

    const qInitData = encodeAbiParameters(
      [{ type: "address" }],
      [HatsFractionTokenModule.address],
    );
    await HatsModuleFactory.write.createHatsModule([
      HatsQuestModule_IMPL.address,
      topHatId,
      "0x",
      qInitData,
      0n,
    ]);
    HatsQuestModule = await viem.getContractAt(
      "HatsQuestModule",
      (await HatsModuleFactory.read.getHatsModuleAddress([
        HatsQuestModule_IMPL.address,
        topHatId,
        "0x",
        0n,
      ])) as Address,
    );

    // The TimeFrameModule must wear the hatter hat to be allowed to mint
    // child hats (workHat). Mint hatter to both FractionToken and TimeFrame.
    await Hats.write.mintHat([hatterHatId, HatsFractionTokenModule.address], {
      account: admin.account,
    });
    await Hats.write.mintHat([hatterHatId, HatsTimeFrameModule.address], {
      account: admin.account,
    });
    // Use TimeFrameModule so that woreTime is recorded with a past timestamp
    // — otherwise `_getHatsTimeFrameMultiplier` returns 0 and
    // SplitsCreator.preview panics on a divide-by-zero. The minter hat is
    // topHatId (set in init); admin wears the top hat so they're authorized.
    const pastWoreTime = 1n;
    await HatsTimeFrameModule.write.mintHat(
      [workHatId, creatorAddr, pastWoreTime],
      { account: admin.account },
    );
    await HatsTimeFrameModule.write.mintHat(
      [workHatId, submitterAddr, pastWoreTime],
      { account: admin.account },
    );

    // Initial RoleShare: 10_000 to creator
    await HatsFractionTokenModule.write.mintInitialSupply(
      [workHatId, creatorAddr, 0n],
      { account: creator.account },
    );

    // Allow QuestModule to escrow on behalf of creator
    await HatsFractionTokenModule.write.setApprovalForAll(
      [HatsQuestModule.address, true],
      { account: creator.account },
    );

    // ====== ThanksToken (required by SplitsCreator constructor args) ======
    await ThanksTokenFactory.write.setBigBang([validateAddress(bigBang)]);
    const ttCreateTx =
      await ThanksTokenFactory.write.createThanksTokenDeterministic(
        [
          "TT",
          "TT",
          validateAddress(bigBang),
          HatsFractionTokenModule.address,
          HatsTimeFrameModule.address,
          ("0x" + "01".repeat(32)) as `0x${string}`,
        ],
        { account: bigBang.account },
      );
    const ttReceipt = await publicClient.waitForTransactionReceipt({
      hash: ttCreateTx,
    });
    let thanksTokenAddress: Address | undefined;
    for (const log of ttReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: ThanksTokenFactory.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "ThanksTokenCreated") {
          thanksTokenAddress = decoded.args.tokenAddress as Address;
        }
      } catch {}
    }
    if (!thanksTokenAddress) throw new Error("thanks token not created");
    ThanksToken = await viem.getContractAt("ThanksToken", thanksTokenAddress);

    // ====== SplitsCreatorFactory + SplitsCreator clone wired with QuestModule ======
    const { SplitsCreatorFactory: _scf } = await deploySplitsCreatorFactory(
      SplitsCreator_IMPL.address,
      Create2Deployer.address,
    );
    SplitsCreatorFactory = _scf;
    await SplitsCreatorFactory.write.setBigBang([validateAddress(bigBang)]);

    const salt = keccak256("0x4242");
    const predicted =
      await SplitsCreatorFactory.read.predictDeterministicAddress([
        topHatId,
        Hats.address,
        PullSplitsFactory.address,
        HatsTimeFrameModule.address,
        HatsFractionTokenModule.address,
        ThanksToken.address,
        HatsQuestModule.address,
        salt,
      ]);
    await SplitsCreatorFactory.write.createSplitCreatorDeterministic(
      [
        topHatId,
        Hats.address,
        PullSplitsFactory.address,
        HatsTimeFrameModule.address,
        HatsFractionTokenModule.address,
        ThanksToken.address,
        HatsQuestModule.address,
        salt,
      ],
      { account: bigBang.account },
    );
    SplitsCreator = await viem.getContractAt(
      "SplitsCreator",
      predicted as Address,
    );

    expect((await SplitsCreator.read.HATS_QUEST_MODULE()).toLowerCase()).to.equal(
      HatsQuestModule.address.toLowerCase(),
    );
  });

  it("baseline preview: only the wearer appears in the recipients", async () => {
    const { shareHolders, map } = await previewScores();
    expect(shareHolders.map((a) => a.toLowerCase())).to.deep.equal([
      creatorAddr.toLowerCase(),
    ]);
    expect(map[creatorAddr.toLowerCase()] > 0n, "creator score positive").to.be.true;
  });

  it("while escrowed: quest module is excluded from recipients and creator score is preserved", async () => {
    const baseline = await previewScores();

    await HatsQuestModule.write.createQuest(
      [workHatId, creatorAddr, 4_000n, ("0x" + "ab".repeat(32)) as `0x${string}`],
      { account: creator.account },
    );

    const escrowed = await previewScores();
    const lowerHolders = escrowed.shareHolders.map((a) => a.toLowerCase());

    // Quest module never appears in the recipient list.
    expect(lowerHolders).to.not.include(HatsQuestModule.address.toLowerCase());

    // The creator's score is unchanged (escrow credited back to them).
    expect(escrowed.map[creatorAddr.toLowerCase()]).to.equal(
      baseline.map[creatorAddr.toLowerCase()],
    );

    // The submitter is not yet a holder.
    expect(escrowed.map[submitterAddr.toLowerCase()]).to.equal(undefined);
  });

  it("after completion: submitter shows up with the released share", async () => {
    // The quest created above has questId = 0 (we created it in the previous test).
    const questId = 0n;
    await HatsQuestModule.write.submitCompletion([questId, workHatId], {
      account: submitter.account,
    });
    await HatsQuestModule.write.approve([questId, workHatId], {
      account: creator.account,
    });

    const { shareHolders, map } = await previewScores();
    const lower = shareHolders.map((a) => a.toLowerCase());

    expect(lower).to.include(submitterAddr.toLowerCase());
    expect(lower).to.not.include(HatsQuestModule.address.toLowerCase());
    expect(map[submitterAddr.toLowerCase()] > 0n, "submitter score positive").to.be.true;
    expect(map[creatorAddr.toLowerCase()] > 0n, "creator score positive").to.be.true;

    // Sanity: submitter score reflects released share, less than creator's
    // because creator still holds the larger residual balance.
    expect(
      map[creatorAddr.toLowerCase()] > map[submitterAddr.toLowerCase()],
      "creator > submitter",
    ).to.be.true;
  });

  it("after cancellation: creator score returns to the pre-escrow baseline", async () => {
    // Snapshot the score with the released share already moved to submitter.
    const before = await previewScores();
    const creatorBefore = before.map[creatorAddr.toLowerCase()];

    // New quest; cancelled before any submission.
    const txHash = await HatsQuestModule.write.createQuest(
      [workHatId, creatorAddr, 1_500n, ("0x" + "cd".repeat(32)) as `0x${string}`],
      { account: creator.account },
    );
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    let newQuestId: bigint | undefined;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: HatsQuestModule.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "QuestCreated") {
          newQuestId = decoded.args.questId as bigint;
        }
      } catch {}
    }
    if (newQuestId === undefined) throw new Error("quest id not found");

    // While escrowed, creator score is preserved.
    const duringEscrow = await previewScores();
    expect(duringEscrow.map[creatorAddr.toLowerCase()]).to.equal(creatorBefore);

    // After cancel, no change.
    await HatsQuestModule.write.cancel([newQuestId], {
      account: creator.account,
    });
    const after = await previewScores();
    expect(after.map[creatorAddr.toLowerCase()]).to.equal(creatorBefore);
    expect(
      after.shareHolders.map((a) => a.toLowerCase()),
    ).to.not.include(HatsQuestModule.address.toLowerCase());
  });
});
