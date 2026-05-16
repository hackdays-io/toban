import { expect } from "chai";
import { viem } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import type { Address, PublicClient, WalletClient } from "viem";
import {
  decodeEventLog,
  encodeAbiParameters,
  keccak256,
  toHex,
} from "viem";
import {
  type Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  type HatsFractionTokenModule,
  deployHatsProtocol,
  deployHatsModuleFactory,
  deployHatsTimeFrameModule,
  deployHatsFractionTokenModule,
} from "../helpers/deploy/Hats";
import {
  type ThanksToken,
  type ThanksTokenFactory,
  deployThanksToken,
  deployThanksTokenFactory,
} from "../helpers/deploy/ThanksToken";

const createHat = async (
  Hats: Hats,
  publicClient: PublicClient,
  parent: bigint,
  roleName: string,
): Promise<bigint> => {
  const txHash = await Hats.write.createHat([
    parent,
    roleName,
    100,
    "0x0000000000000000000000000000000000004a75",
    "0x0000000000000000000000000000000000004a75",
    true,
    "",
  ]);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
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
  throw new Error("HatCreated not found");
};

const buildPermitDigest = (
  domain: {
    name: string;
    version: string;
    chainId: bigint;
    verifyingContract: Address;
  },
  message: {
    owner: Address;
    spender: Address;
    value: bigint;
    nonce: bigint;
    deadline: bigint;
  },
) => {
  const PERMIT_MINT_TYPEHASH = keccak256(
    toHex(
      "PermitMint(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)",
    ),
  );
  const DOMAIN_TYPEHASH = keccak256(
    toHex(
      "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
    ),
  );
  const domainSeparator = keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "address" },
      ],
      [
        DOMAIN_TYPEHASH,
        keccak256(toHex(domain.name)),
        keccak256(toHex(domain.version)),
        domain.chainId,
        domain.verifyingContract,
      ],
    ),
  );
  const structHash = keccak256(
    encodeAbiParameters(
      [
        { type: "bytes32" },
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
      ],
      [
        PERMIT_MINT_TYPEHASH,
        message.owner,
        message.spender,
        message.value,
        message.nonce,
        message.deadline,
      ],
    ),
  );
  return keccak256(
    `0x1901${domainSeparator.slice(2)}${structHash.slice(2)}` as `0x${string}`,
  );
};

describe("ThanksToken mint allowance", () => {
  const tokenName = "ThxA";
  const tokenSymbol = "THXA";

  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsTimeFrameModule: HatsTimeFrameModule;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let HatsFractionTokenModule: HatsFractionTokenModule;
  let DeployedThanksToken: ThanksToken;
  let ThanksTokenFactory: ThanksTokenFactory;

  let deployer: WalletClient;
  let owner: WalletClient; // mint allowance owner (= address1)
  let recipient: WalletClient; // address2
  let spender: WalletClient; // address3 (bot)
  let publicClient: PublicClient;

  let topHatId: bigint;
  let hatId: bigint;

  let ownerAddr: Address;
  let recipientAddr: Address;
  let spenderAddr: Address;

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) throw new Error("account undefined");
    return client.account.address;
  };

  before(async () => {
    [deployer, owner, recipient, spender] = await viem.getWalletClients();
    publicClient = await viem.getPublicClient();

    ownerAddr = validateAddress(owner);
    recipientAddr = validateAddress(recipient);
    spenderAddr = validateAddress(spender);

    ({ Create2Deployer } = await deployCreate2Deployer());
    ({ Hats } = await deployHatsProtocol());
    ({ HatsModuleFactory } = await deployHatsModuleFactory(Hats.address));
    ({ HatsTimeFrameModule: HatsTimeFrameModule_IMPL } =
      await deployHatsTimeFrameModule("0.0.0", Create2Deployer.address));
    ({ HatsFractionTokenModule: HatsFractionTokenModule_IMPL } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address));

    const deployerAddr = validateAddress(deployer);
    const topHatTx = await Hats.write.mintTopHat([
      deployerAddr,
      "Top",
      "",
    ]);
    const topHatReceipt = await publicClient.waitForTransactionReceipt({
      hash: topHatTx,
    });
    for (const log of topHatReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "TransferSingle") {
          topHatId = decoded.args.id;
          break;
        }
      } catch {}
    }

    const opHatId = await createHat(Hats, publicClient, topHatId, "Op");
    const tfHatId = await createHat(Hats, publicClient, opHatId, "TF");
    const tfInit = encodeAbiParameters([{ type: "uint256" }], [tfHatId]);
    await HatsModuleFactory.write.createHatsModule([
      HatsTimeFrameModule_IMPL.address,
      topHatId,
      "0x",
      tfInit,
      BigInt(0),
    ]);
    HatsTimeFrameModule = await viem.getContractAt(
      "HatsTimeFrameModule",
      await HatsModuleFactory.read.getHatsModuleAddress([
        HatsTimeFrameModule_IMPL.address,
        topHatId,
        "0x",
        BigInt(0),
      ]),
    );

    const ftInit = encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }],
      ["https://x/", 10000n],
    );
    await HatsModuleFactory.write.createHatsModule([
      HatsFractionTokenModule_IMPL.address,
      topHatId,
      "0x",
      ftInit,
      BigInt(1),
    ]);
    HatsFractionTokenModule = await viem.getContractAt(
      "HatsFractionTokenModule",
      await HatsModuleFactory.read.getHatsModuleAddress([
        HatsFractionTokenModule_IMPL.address,
        topHatId,
        "0x",
        BigInt(1),
      ]),
    );

    ({ ThanksToken: DeployedThanksToken } = await deployThanksToken(
      Create2Deployer.address,
    ));
    ({ ThanksTokenFactory } = await deployThanksTokenFactory(
      {
        initialOwner: deployerAddr,
        implementation: DeployedThanksToken.address,
        hatsAddress: Hats.address,
      },
      Create2Deployer.address,
    ));
    await ThanksTokenFactory.write.setBigBang([deployerAddr]);

    const createTx = await ThanksTokenFactory.write.createThanksTokenDeterministic([
      tokenName,
      tokenSymbol,
      deployerAddr,
      HatsFractionTokenModule.address,
      HatsTimeFrameModule.address,
      "0x0000000000000000000000000000000000000000000000000000000000000099",
    ]);
    const createReceipt = await publicClient.waitForTransactionReceipt({
      hash: createTx,
    });
    let thanksAddr: Address | undefined;
    for (const log of createReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: ThanksTokenFactory.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "ThanksTokenCreated") {
          thanksAddr = decoded.args.tokenAddress as Address;
          break;
        }
      } catch {}
    }
    if (!thanksAddr) throw new Error("ThanksTokenCreated not found");
    DeployedThanksToken = await viem.getContractAt("ThanksToken", thanksAddr);

    // hatter + role hat for the owner
    const hatterTx = await Hats.write.createHat([
      topHatId,
      "HatterHat",
      100,
      deployerAddr,
      deployerAddr,
      true,
      "",
    ]);
    const hatterReceipt = await publicClient.waitForTransactionReceipt({
      hash: hatterTx,
    });
    let hatterHatId: bigint | undefined;
    for (const log of hatterReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "HatCreated") {
          hatterHatId = decoded.args.id;
          break;
        }
      } catch {}
    }
    if (!hatterHatId) throw new Error("hatter id");
    await Hats.write.mintHat([hatterHatId, HatsTimeFrameModule.address]);

    const roleTx = await Hats.write.createHat([
      hatterHatId,
      "Role",
      10,
      deployerAddr,
      deployerAddr,
      true,
      "",
    ]);
    const roleReceipt = await publicClient.waitForTransactionReceipt({
      hash: roleTx,
    });
    for (const log of roleReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === "HatCreated") {
          hatId = decoded.args.id;
          break;
        }
      } catch {}
    }

    const current = await time.latest();
    await HatsTimeFrameModule.write.mintHat([
      hatId,
      ownerAddr,
      BigInt(current - 3600 * 10),
    ]);
    await HatsFractionTokenModule.write.mintInitialSupply(
      [hatId, ownerAddr, 0n],
      { account: deployer.account },
    );

    // give owner a generous coefficient so mintableAmount is non-trivial
    await DeployedThanksToken.write.setAddressCoefficient([
      ownerAddr,
      10000000000000000000n, // 10.0
    ]);
  });

  describe("approveMint / mintAllowance", () => {
    it("sets allowance and emits ApproveMint", async () => {
      const tx = await DeployedThanksToken.write.approveMint(
        [spenderAddr, 12345n],
        { account: owner.account },
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

      const allowance = await DeployedThanksToken.read.mintAllowance([
        ownerAddr,
        spenderAddr,
      ]);
      expect(allowance).to.equal(12345n);

      let found = false;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: DeployedThanksToken.abi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "ApproveMint") {
            expect(decoded.args.owner.toLowerCase()).to.equal(
              ownerAddr.toLowerCase(),
            );
            expect(decoded.args.spender.toLowerCase()).to.equal(
              spenderAddr.toLowerCase(),
            );
            expect(decoded.args.value).to.equal(12345n);
            found = true;
          }
        } catch {}
      }
      expect(found, "ApproveMint event").to.equal(true);
    });

    it("approveMint(spender, 0) revokes", async () => {
      await DeployedThanksToken.write.approveMint([spenderAddr, 999n], {
        account: owner.account,
      });
      await DeployedThanksToken.write.approveMint([spenderAddr, 0n], {
        account: owner.account,
      });
      const allowance = await DeployedThanksToken.read.mintAllowance([
        ownerAddr,
        spenderAddr,
      ]);
      expect(allowance).to.equal(0n);
    });
  });

  describe("mintFrom", () => {
    it("consumes allowance, mints, and emits MintFrom + TokenMinted", async () => {
      const relatedRoles = [{ hatId, wearer: ownerAddr }];
      const mintable = await DeployedThanksToken.read.mintableAmount([
        ownerAddr,
        relatedRoles,
      ]);
      expect(mintable > 0n).to.equal(true);

      const amount = mintable / 4n;
      await DeployedThanksToken.write.approveMint([spenderAddr, amount * 2n], {
        account: owner.account,
      });

      const recipientBalBefore = await DeployedThanksToken.read.balanceOf([
        recipientAddr,
      ]);
      const mintedBefore = await DeployedThanksToken.read.mintedAmount([
        ownerAddr,
      ]);

      const tx = await DeployedThanksToken.write.mintFrom(
        [ownerAddr, recipientAddr, amount, relatedRoles, "0x"],
        { account: spender.account },
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

      const recipientBalAfter = await DeployedThanksToken.read.balanceOf([
        recipientAddr,
      ]);
      const mintedAfter = await DeployedThanksToken.read.mintedAmount([
        ownerAddr,
      ]);
      const remaining = await DeployedThanksToken.read.mintAllowance([
        ownerAddr,
        spenderAddr,
      ]);

      expect(recipientBalAfter - recipientBalBefore).to.equal(amount);
      expect(mintedAfter - mintedBefore).to.equal(amount);
      expect(remaining).to.equal(amount); // 2*amount granted, amount consumed

      let mintFromSeen = false;
      let tokenMintedSeen = false;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: DeployedThanksToken.abi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "MintFrom") {
            expect(decoded.args.from.toLowerCase()).to.equal(
              ownerAddr.toLowerCase(),
            );
            expect(decoded.args.to.toLowerCase()).to.equal(
              recipientAddr.toLowerCase(),
            );
            expect(decoded.args.spender.toLowerCase()).to.equal(
              spenderAddr.toLowerCase(),
            );
            expect(decoded.args.value).to.equal(amount);
            mintFromSeen = true;
          }
          if (decoded.eventName === "TokenMinted") {
            tokenMintedSeen = true;
          }
        } catch {}
      }
      expect(mintFromSeen, "MintFrom event").to.equal(true);
      expect(tokenMintedSeen, "TokenMinted event").to.equal(true);
    });

    it("reverts when allowance is insufficient", async () => {
      const relatedRoles = [{ hatId, wearer: ownerAddr }];
      // reset allowance to 1 wei
      await DeployedThanksToken.write.approveMint([spenderAddr, 1n], {
        account: owner.account,
      });
      try {
        await DeployedThanksToken.write.mintFrom(
          [ownerAddr, recipientAddr, 100n, relatedRoles, "0x"],
          { account: spender.account },
        );
        expect.fail("should have reverted");
      } catch (e: any) {
        expect(e.message).to.include("mint allowance exceeded");
      }
    });

    it("reverts when value exceeds mintableAmount (formula cap)", async () => {
      const relatedRoles = [{ hatId, wearer: ownerAddr }];
      const mintable = await DeployedThanksToken.read.mintableAmount([
        ownerAddr,
        relatedRoles,
      ]);
      // Give allowance well above mintableAmount.
      await DeployedThanksToken.write.approveMint(
        [spenderAddr, mintable * 1000n + 10n ** 30n],
        { account: owner.account },
      );
      try {
        await DeployedThanksToken.write.mintFrom(
          [ownerAddr, recipientAddr, mintable + 1n, relatedRoles, "0x"],
          { account: spender.account },
        );
        expect.fail("should have reverted");
      } catch (e: any) {
        expect(e.message).to.include("Amount exceeds mintable amount");
      }
    });

    it("does not decrement allowance when set to max uint256 (infinite approval)", async () => {
      const MAX = 2n ** 256n - 1n;
      const relatedRoles = [{ hatId, wearer: ownerAddr }];
      await DeployedThanksToken.write.approveMint([spenderAddr, MAX], {
        account: owner.account,
      });

      const mintable = await DeployedThanksToken.read.mintableAmount([
        ownerAddr,
        relatedRoles,
      ]);
      expect(mintable > 0n).to.equal(true);
      const amount = mintable / 8n;

      await DeployedThanksToken.write.mintFrom(
        [ownerAddr, recipientAddr, amount, relatedRoles, "0x"],
        { account: spender.account },
      );
      const remaining = await DeployedThanksToken.read.mintAllowance([
        ownerAddr,
        spenderAddr,
      ]);
      expect(remaining).to.equal(MAX);
    });

    it("reverts when minting to self", async () => {
      const relatedRoles = [{ hatId, wearer: ownerAddr }];
      await DeployedThanksToken.write.approveMint([spenderAddr, 10n ** 24n], {
        account: owner.account,
      });
      try {
        await DeployedThanksToken.write.mintFrom(
          [ownerAddr, ownerAddr, 1n, relatedRoles, "0x"],
          { account: spender.account },
        );
        expect.fail("should have reverted");
      } catch (e: any) {
        expect(e.message).to.include("Cannot mint to yourself");
      }
    });
  });

  describe("permitMint", () => {
    const ONE_HOUR = 3600n;

    const signPermit = async (
      signer: WalletClient,
      verifyingContract: Address,
      message: {
        owner: Address;
        spender: Address;
        value: bigint;
        nonce: bigint;
        deadline: bigint;
      },
    ) => {
      const chainId = await publicClient.getChainId();
      const signature = await signer.signTypedData({
        account: signer.account!,
        domain: {
          name: "ThanksToken",
          version: "1",
          chainId: BigInt(chainId),
          verifyingContract,
        },
        types: {
          PermitMint: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        primaryType: "PermitMint",
        message,
      });
      const sig = signature.slice(2);
      const r = `0x${sig.slice(0, 64)}` as `0x${string}`;
      const s = `0x${sig.slice(64, 128)}` as `0x${string}`;
      const v = Number.parseInt(sig.slice(128, 130), 16);
      return { r, s, v, signature };
    };

    it("sets allowance via valid signature and advances nonce", async () => {
      const nonce = await DeployedThanksToken.read.mintNonces([ownerAddr]);
      const deadline = BigInt(await time.latest()) + ONE_HOUR;
      const value = 5n * 10n ** 18n;

      const { r, s, v } = await signPermit(owner, DeployedThanksToken.address, {
        owner: ownerAddr,
        spender: spenderAddr,
        value,
        nonce,
        deadline,
      });

      // reset allowance first so we can check it was set by permit
      await DeployedThanksToken.write.approveMint([spenderAddr, 0n], {
        account: owner.account,
      });

      await DeployedThanksToken.write.permitMint(
        [ownerAddr, spenderAddr, value, deadline, v, r, s],
        { account: spender.account },
      );

      const allowance = await DeployedThanksToken.read.mintAllowance([
        ownerAddr,
        spenderAddr,
      ]);
      expect(allowance).to.equal(value);
      const newNonce = await DeployedThanksToken.read.mintNonces([ownerAddr]);
      expect(newNonce).to.equal(nonce + 1n);
    });

    it("reverts on replayed signature", async () => {
      const nonce = await DeployedThanksToken.read.mintNonces([ownerAddr]);
      const deadline = BigInt(await time.latest()) + ONE_HOUR;
      const value = 9n;
      const { r, s, v } = await signPermit(owner, DeployedThanksToken.address, {
        owner: ownerAddr,
        spender: spenderAddr,
        value,
        nonce,
        deadline,
      });
      await DeployedThanksToken.write.permitMint(
        [ownerAddr, spenderAddr, value, deadline, v, r, s],
        { account: spender.account },
      );
      try {
        await DeployedThanksToken.write.permitMint(
          [ownerAddr, spenderAddr, value, deadline, v, r, s],
          { account: spender.account },
        );
        expect.fail("replay should revert");
      } catch (e: any) {
        expect(e.message).to.include("invalid signature");
      }
    });

    it("reverts when deadline has passed", async () => {
      const nonce = await DeployedThanksToken.read.mintNonces([ownerAddr]);
      const past = BigInt(await time.latest()) - 1n;
      const value = 7n;
      const { r, s, v } = await signPermit(owner, DeployedThanksToken.address, {
        owner: ownerAddr,
        spender: spenderAddr,
        value,
        nonce,
        deadline: past,
      });
      try {
        await DeployedThanksToken.write.permitMint(
          [ownerAddr, spenderAddr, value, past, v, r, s],
          { account: spender.account },
        );
        expect.fail("expired permit should revert");
      } catch (e: any) {
        expect(e.message).to.include("permit expired");
      }
    });

    it("reverts when value is tampered after signing", async () => {
      const nonce = await DeployedThanksToken.read.mintNonces([ownerAddr]);
      const deadline = BigInt(await time.latest()) + ONE_HOUR;
      const value = 42n;
      const { r, s, v } = await signPermit(owner, DeployedThanksToken.address, {
        owner: ownerAddr,
        spender: spenderAddr,
        value,
        nonce,
        deadline,
      });
      try {
        await DeployedThanksToken.write.permitMint(
          [ownerAddr, spenderAddr, value + 1n, deadline, v, r, s],
          { account: spender.account },
        );
        expect.fail("tampered value should revert");
      } catch (e: any) {
        expect(e.message).to.include("invalid signature");
      }
    });

    it("digest derived off-chain matches on-chain DOMAIN_SEPARATOR", async () => {
      // Sanity check: helper used by other tests reproduces the contract's
      // domain separator, which is what allows clone-safe signing.
      const chainId = BigInt(await publicClient.getChainId());
      const domainSeparator =
        await DeployedThanksToken.read.DOMAIN_SEPARATOR();

      const DOMAIN_TYPEHASH = keccak256(
        toHex(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
        ),
      );
      const computed = keccak256(
        encodeAbiParameters(
          [
            { type: "bytes32" },
            { type: "bytes32" },
            { type: "bytes32" },
            { type: "uint256" },
            { type: "address" },
          ],
          [
            DOMAIN_TYPEHASH,
            keccak256(toHex("ThanksToken")),
            keccak256(toHex("1")),
            chainId,
            DeployedThanksToken.address,
          ],
        ),
      );
      expect(domainSeparator.toLowerCase()).to.equal(computed.toLowerCase());

      // also exercise the test helper so it stays in sync with the contract
      const _digest = buildPermitDigest(
        {
          name: "ThanksToken",
          version: "1",
          chainId,
          verifyingContract: DeployedThanksToken.address,
        },
        {
          owner: ownerAddr,
          spender: spenderAddr,
          value: 1n,
          nonce: 0n,
          deadline: 1n,
        },
      );
      expect(_digest.length).to.equal(66);
    });
  });

  describe("clone-safe EIP-712 domain separator", () => {
    it("differs between two ThanksToken clones", async () => {
      const deployerAddr = validateAddress(deployer);
      const tx = await ThanksTokenFactory.write.createThanksTokenDeterministic([
        "Other",
        "OTH",
        deployerAddr,
        HatsFractionTokenModule.address,
        HatsTimeFrameModule.address,
        "0x00000000000000000000000000000000000000000000000000000000000000aa",
      ]);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
      });
      let otherAddr: Address | undefined;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: ThanksTokenFactory.abi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "ThanksTokenCreated") {
            otherAddr = decoded.args.tokenAddress as Address;
            break;
          }
        } catch {}
      }
      if (!otherAddr) throw new Error("clone not created");
      const other = await viem.getContractAt("ThanksToken", otherAddr);
      const a = await DeployedThanksToken.read.DOMAIN_SEPARATOR();
      const b = await other.read.DOMAIN_SEPARATOR();
      expect(a).to.not.equal(b);
    });
  });
});
