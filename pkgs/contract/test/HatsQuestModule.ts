import { expect } from "chai";
import { viem } from "hardhat";
import {
  type Address,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  encodeAbiParameters,
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
  deployHatsFractionTokenModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsQuestModule,
} from "../helpers/deploy/Hats";

describe("HatsQuestModule", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let HatsFractionTokenModule: HatsFractionTokenModule;
  let HatsQuestModule_IMPL: HatsQuestModule;
  let HatsQuestModule: HatsQuestModule;

  let admin: WalletClient;
  let creator: WalletClient;
  let submitter: WalletClient;
  let approver: WalletClient;
  let outsider: WalletClient;

  let adminAddr: Address;
  let creatorAddr: Address;
  let submitterAddr: Address;
  let approverAddr: Address;
  let outsiderAddr: Address;

  let publicClient: PublicClient;

  let topHatId: bigint;
  let hatterHatId: bigint;
  let workHatId: bigint;
  let foreignTopHatId: bigint;
  let foreignHatId: bigint;

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) throw new Error("missing account");
    return client.account.address;
  };

  const decodeQuestId = (logs: any[]): bigint => {
    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: HatsQuestModule.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "QuestCreated") {
          return decoded.args.questId as bigint;
        }
      } catch {}
    }
    throw new Error("QuestCreated event not found");
  };

  before(async () => {
    [admin, creator, submitter, approver, outsider] =
      await viem.getWalletClients();
    adminAddr = validateAddress(admin);
    creatorAddr = validateAddress(creator);
    submitterAddr = validateAddress(submitter);
    approverAddr = validateAddress(approver);
    outsiderAddr = validateAddress(outsider);

    publicClient = await viem.getPublicClient();

    const { Create2Deployer: _Create2Deployer } = await deployCreate2Deployer();
    Create2Deployer = _Create2Deployer;

    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    const { HatsModuleFactory: _HatsModuleFactory } =
      await deployHatsModuleFactory(_Hats.address);
    HatsModuleFactory = _HatsModuleFactory;

    const { HatsFractionTokenModule: _ftIMPL } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address);
    HatsFractionTokenModule_IMPL = _ftIMPL;

    const { HatsQuestModule: _qIMPL } = await deployHatsQuestModule(
      "0.0.0",
      Create2Deployer.address,
    );
    HatsQuestModule_IMPL = _qIMPL;

    // Mint a top hat to admin (workspace 1)
    await Hats.write.mintTopHat([adminAddr, "Workspace", "ipfs://workspace"]);
    topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );

    // Hatter hat under top hat (so workHat can be auto-minted)
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
    for (const log of receipt.logs) {
      const decoded = decodeEventLog({
        abi: Hats.abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "HatCreated") {
        hatterHatId = decoded.args.id as bigint;
      }
    }

    // Work hat (the one we'll back with RoleShare)
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
      if (decoded.eventName === "HatCreated") {
        workHatId = decoded.args.id as bigint;
      }
    }

    // Set up a separate workspace (different domain) to test cross-domain checks
    await Hats.write.mintTopHat([
      outsiderAddr,
      "ForeignWorkspace",
      "ipfs://foreign",
    ]);
    foreignTopHatId = BigInt(
      "0x0000000200000000000000000000000000000000000000000000000000000000",
    );
    txHash = await Hats.write.createHat(
      [
        foreignTopHatId,
        "ForeignHat",
        10,
        "0x0000000000000000000000000000000000004A75",
        "0x0000000000000000000000000000000000004A75",
        true,
        "",
      ],
      { account: outsider.account },
    );
    receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    for (const log of receipt.logs) {
      const decoded = decodeEventLog({
        abi: Hats.abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "HatCreated") {
        foreignHatId = decoded.args.id as bigint;
      }
    }

    // Deploy the FractionToken module (clone) under the top hat
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
    const ftAddress = await HatsModuleFactory.read.getHatsModuleAddress([
      HatsFractionTokenModule_IMPL.address,
      topHatId,
      "0x",
      0n,
    ]);
    HatsFractionTokenModule = await viem.getContractAt(
      "HatsFractionTokenModule",
      ftAddress as Address,
    );

    // Mint hatter hat to FT module so it can mint child hats indirectly
    await Hats.write.mintHat(
      [hatterHatId, HatsFractionTokenModule.address],
      { account: admin.account },
    );

    // Mint the work hat to creator, submitter, and approver so they are workspace members
    await Hats.write.mintHat([workHatId, creatorAddr], {
      account: admin.account,
    });
    await Hats.write.mintHat([workHatId, submitterAddr], {
      account: admin.account,
    });
    await Hats.write.mintHat([workHatId, approverAddr], {
      account: admin.account,
    });

    // Mint initial RoleShare supply for the creator (10_000)
    await HatsFractionTokenModule.write.mintInitialSupply(
      [workHatId, creatorAddr, 0n],
      { account: creator.account },
    );

    // Deploy QuestModule (clone) bound to the FractionToken module
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
    const qAddress = await HatsModuleFactory.read.getHatsModuleAddress([
      HatsQuestModule_IMPL.address,
      topHatId,
      "0x",
      0n,
    ]);
    HatsQuestModule = await viem.getContractAt(
      "HatsQuestModule",
      qAddress as Address,
    );

    // Creator approves QuestModule to move RoleShare
    await HatsFractionTokenModule.write.setApprovalForAll(
      [HatsQuestModule.address, true],
      { account: creator.account },
    );
  });

  describe("initialization", () => {
    it("binds to the correct fraction token and domain", async () => {
      expect(
        (await HatsQuestModule.read.FRACTION_TOKEN()).toLowerCase(),
      ).to.equal(HatsFractionTokenModule.address.toLowerCase());
      expect(await HatsQuestModule.read.getDomain()).to.equal(1);
      expect(await HatsQuestModule.read.nextQuestId()).to.equal(0n);
    });
  });

  describe("createQuest", () => {
    it("reverts on amount = 0", async () => {
      await expect(
        HatsQuestModule.write.createQuest(
          [workHatId, creatorAddr, 0n, "0x" + "00".repeat(32) as `0x${string}`],
          { account: creator.account },
        ),
      ).to.be.rejectedWith(/InvalidAmount/);
    });

    it("reverts when hatId is outside the workspace domain", async () => {
      await expect(
        HatsQuestModule.write.createQuest(
          [
            foreignHatId,
            creatorAddr,
            100n,
            "0x" + "00".repeat(32) as `0x${string}`,
          ],
          { account: creator.account },
        ),
      ).to.be.rejectedWith(/InvalidHatDomain/);
    });

    it("reverts when caller balance is insufficient", async () => {
      await expect(
        HatsQuestModule.write.createQuest(
          [
            workHatId,
            creatorAddr,
            10_001n,
            "0x" + "00".repeat(32) as `0x${string}`,
          ],
          { account: creator.account },
        ),
      ).to.be.rejectedWith(/InsufficientShare/);
    });

    it("escrows the share and creates the quest in Open state", async () => {
      const tokenId = await HatsFractionTokenModule.read.getTokenId([
        workHatId,
        creatorAddr,
      ]);
      const balanceBefore = await HatsFractionTokenModule.read.balanceOf([
        creatorAddr,
        tokenId,
      ]);

      const txHash = await HatsQuestModule.write.createQuest(
        [
          workHatId,
          creatorAddr,
          1_000n,
          "0x" + "11".repeat(32) as `0x${string}`,
        ],
        { account: creator.account },
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const questId = decodeQuestId(receipt.logs);
      expect(questId).to.equal(0n);

      const quest = await HatsQuestModule.read.getQuest([questId]);
      expect(quest.creator.toLowerCase()).to.equal(creatorAddr.toLowerCase());
      expect(quest.amount).to.equal(1_000n);
      expect(quest.status).to.equal(0); // Open

      // Escrow accounting
      expect(
        await HatsQuestModule.read.getEscrowedBalance([
          creatorAddr,
          workHatId,
          creatorAddr,
        ]),
      ).to.equal(1_000n);

      // Token actually moved into the module
      expect(
        await HatsFractionTokenModule.read.balanceOf([
          HatsQuestModule.address,
          tokenId,
        ]),
      ).to.equal(1_000n);
      expect(
        await HatsFractionTokenModule.read.balanceOf([creatorAddr, tokenId]),
      ).to.equal(balanceBefore - 1_000n);
    });
  });

  describe("submitCompletion", () => {
    it("reverts when caller is the creator", async () => {
      await expect(
        HatsQuestModule.write.submitCompletion([0n, workHatId], {
          account: creator.account,
        }),
      ).to.be.rejectedWith(/CannotSubmitOwnQuest/);
    });

    it("reverts when caller is not a workspace member", async () => {
      // outsider does not wear any hat in this workspace
      await expect(
        HatsQuestModule.write.submitCompletion([0n, foreignHatId], {
          account: outsider.account,
        }),
      ).to.be.rejectedWith(/NotWorkspaceMember|InvalidHatDomain/);
    });

    it("transitions the quest to PendingReview", async () => {
      await HatsQuestModule.write.submitCompletion([0n, workHatId], {
        account: submitter.account,
      });
      const quest = await HatsQuestModule.read.getQuest([0n]);
      expect(quest.submitter.toLowerCase()).to.equal(
        submitterAddr.toLowerCase(),
      );
      expect(quest.status).to.equal(1); // PendingReview
    });

    it("reverts on second submission of the same quest", async () => {
      await expect(
        HatsQuestModule.write.submitCompletion([0n, workHatId], {
          account: approver.account,
        }),
      ).to.be.rejectedWith(/InvalidStatus/);
    });
  });

  describe("approve", () => {
    it("reverts when submitter tries to approve their own submission", async () => {
      await expect(
        HatsQuestModule.write.approve([0n, workHatId], {
          account: submitter.account,
        }),
      ).to.be.rejectedWith(/CannotApproveOwnSubmission/);
    });

    it("completes the quest with creator's single approval and releases the escrow", async () => {
      const tokenId = await HatsFractionTokenModule.read.getTokenId([
        workHatId,
        creatorAddr,
      ]);
      const submitterBefore = await HatsFractionTokenModule.read.balanceOf([
        submitterAddr,
        tokenId,
      ]);
      const moduleBefore = await HatsFractionTokenModule.read.balanceOf([
        HatsQuestModule.address,
        tokenId,
      ]);

      await HatsQuestModule.write.approve([0n, workHatId], {
        account: creator.account,
      });

      const quest = await HatsQuestModule.read.getQuest([0n]);
      expect(quest.status).to.equal(2); // Completed

      expect(
        await HatsFractionTokenModule.read.balanceOf([submitterAddr, tokenId]),
      ).to.equal(submitterBefore + 1_000n);
      expect(
        await HatsFractionTokenModule.read.balanceOf([
          HatsQuestModule.address,
          tokenId,
        ]),
      ).to.equal(moduleBefore - 1_000n);

      expect(
        await HatsQuestModule.read.getEscrowedBalance([
          creatorAddr,
          workHatId,
          creatorAddr,
        ]),
      ).to.equal(0n);
    });
  });

  describe("approve (two hat-holder path)", () => {
    let questId: bigint;

    before(async () => {
      const txHash = await HatsQuestModule.write.createQuest(
        [
          workHatId,
          creatorAddr,
          500n,
          "0x" + "22".repeat(32) as `0x${string}`,
        ],
        { account: creator.account },
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      questId = decodeQuestId(receipt.logs);

      await HatsQuestModule.write.submitCompletion([questId, workHatId], {
        account: submitter.account,
      });
    });

    it("does not complete after a single non-creator approval", async () => {
      await HatsQuestModule.write.approve([questId, workHatId], {
        account: approver.account,
      });
      const quest = await HatsQuestModule.read.getQuest([questId]);
      expect(quest.status).to.equal(1); // still PendingReview
      expect(await HatsQuestModule.read.getApprovalCount([questId])).to.equal(
        1,
      );
    });

    it("rejects double approval from the same address", async () => {
      await expect(
        HatsQuestModule.write.approve([questId, workHatId], {
          account: approver.account,
        }),
      ).to.be.rejectedWith(/AlreadyApproved/);
    });

    it("completes after a second distinct hat-holder approves", async () => {
      // admin wears the top hat (domain 1)
      await HatsQuestModule.write.approve([questId, topHatId], {
        account: admin.account,
      });
      const quest = await HatsQuestModule.read.getQuest([questId]);
      expect(quest.status).to.equal(2); // Completed
      expect(
        await HatsQuestModule.read.getEscrowedBalance([
          creatorAddr,
          workHatId,
          creatorAddr,
        ]),
      ).to.equal(0n);
    });
  });

  describe("cancel", () => {
    let questId: bigint;

    before(async () => {
      const txHash = await HatsQuestModule.write.createQuest(
        [
          workHatId,
          creatorAddr,
          200n,
          "0x" + "33".repeat(32) as `0x${string}`,
        ],
        { account: creator.account },
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      questId = decodeQuestId(receipt.logs);
    });

    it("reverts when called by non-creator", async () => {
      await expect(
        HatsQuestModule.write.cancel([questId], { account: submitter.account }),
      ).to.be.rejectedWith(/NotCreator/);
    });

    it("returns the escrow to the creator and marks the quest Cancelled", async () => {
      const tokenId = await HatsFractionTokenModule.read.getTokenId([
        workHatId,
        creatorAddr,
      ]);
      const creatorBefore = await HatsFractionTokenModule.read.balanceOf([
        creatorAddr,
        tokenId,
      ]);

      await HatsQuestModule.write.cancel([questId], {
        account: creator.account,
      });

      const quest = await HatsQuestModule.read.getQuest([questId]);
      expect(quest.status).to.equal(3); // Cancelled
      expect(
        await HatsFractionTokenModule.read.balanceOf([creatorAddr, tokenId]),
      ).to.equal(creatorBefore + 200n);
      expect(
        await HatsQuestModule.read.getEscrowedBalance([
          creatorAddr,
          workHatId,
          creatorAddr,
        ]),
      ).to.equal(0n);
    });

    it("cannot cancel a quest in PendingReview", async () => {
      // create and submit but do not approve
      const txHash = await HatsQuestModule.write.createQuest(
        [
          workHatId,
          creatorAddr,
          100n,
          "0x" + "44".repeat(32) as `0x${string}`,
        ],
        { account: creator.account },
      );
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      const pendingId = decodeQuestId(receipt.logs);
      await HatsQuestModule.write.submitCompletion([pendingId, workHatId], {
        account: submitter.account,
      });

      await expect(
        HatsQuestModule.write.cancel([pendingId], { account: creator.account }),
      ).to.be.rejectedWith(/InvalidStatus/);
    });
  });

  describe("escrow accounting across multiple quests", () => {
    it("accumulates escrowed balance for the same tokenId", async () => {
      // creator may need topup; mint extra so balance is plenty
      await HatsFractionTokenModule.write.mint(
        [workHatId, creatorAddr, 5_000n],
        { account: admin.account },
      );

      const before = await HatsQuestModule.read.getEscrowedBalance([
        creatorAddr,
        workHatId,
        creatorAddr,
      ]);

      await HatsQuestModule.write.createQuest(
        [
          workHatId,
          creatorAddr,
          150n,
          "0x" + "55".repeat(32) as `0x${string}`,
        ],
        { account: creator.account },
      );
      await HatsQuestModule.write.createQuest(
        [
          workHatId,
          creatorAddr,
          250n,
          "0x" + "66".repeat(32) as `0x${string}`,
        ],
        { account: creator.account },
      );

      const after = await HatsQuestModule.read.getEscrowedBalance([
        creatorAddr,
        workHatId,
        creatorAddr,
      ]);

      // before may already include earlier pending quests; only assert delta
      expect(after - before).to.equal(400n);
    });
  });
});
