import { expect } from "chai";
import { viem } from "hardhat";
import {
  type Address,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
} from "viem";
import {
  type Hats,
  type HatsModuleFactory,
  deployEmptyHatsModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
} from "../helpers/deploy/Hats";

const validateAddress = (client: WalletClient): Address => {
  if (!client.account?.address) {
    throw new Error("Wallet client account address is undefined");
  }
  return client.account.address;
};

describe("Hats", () => {
  let Hats: Hats;

  let address1: WalletClient;
  let address1Validated: Address;
  let publicClient: PublicClient;

  before(async () => {
    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    [address1] = await viem.getWalletClients();
    address1Validated = validateAddress(address1);

    publicClient = await viem.getPublicClient();
  });

  it("should mint top hat", async () => {
    await Hats.write.mintTopHat([
      address1Validated,
      "Description",
      "https://test.com/tophat.png",
    ]);
  });

  it("should create new hat", async () => {
    // _adminには親HatのIdを入れる
    // _eligibilityと_toggleはZeroAddress以外
    let txHash = await Hats.write.createHat([
      BigInt(
        "0x0000000100000000000000000000000000000000000000000000000000000000",
      ),
      "test",
      10,
      "0x0000000000000000000000000000000000004a75",
      "0x0000000000000000000000000000000000004a75",
      true,
      "https://test.com/hat_image.png",
    ]);

    let receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    let firstLevelHatId: bigint | undefined;

    for (const log of receipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "HatCreated") {
          firstLevelHatId = decodedLog.args.id;
        }
      } catch (error) {}
    }

    if (!firstLevelHatId) {
      throw new Error("First level hat ID not found in transaction logs");
    }

    // 階層のチェック TopHat => FirstLevel
    expect(await Hats.read.getHatLevel([firstLevelHatId])).equal(1);

    // FirstLevelHatの下に新しいHatを作成
    txHash = await Hats.write.createHat([
      firstLevelHatId,
      "test",
      10,
      "0x0000000000000000000000000000000000004a75",
      "0x0000000000000000000000000000000000004a75",
      true,
      "https://test.com/hat_image.png",
    ]);

    receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    let secondLevelHatId: bigint | undefined;

    for (const log of receipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "HatCreated") {
          secondLevelHatId = decodedLog.args.id;
        }
      } catch (error) {}
    }

    if (!secondLevelHatId) {
      throw new Error("Second level hat ID not found in transaction logs");
    }

    // 階層のチェック TopHat => FirstLevel => SecondLevel
    expect(await Hats.read.getHatLevel([secondLevelHatId])).equal(2);
  });
});

describe("HatsModuleFactory", () => {
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;

  let address1: WalletClient;
  let address1Validated: Address;

  before(async () => {
    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    const { HatsModuleFactory: _HatsModuleFactory } =
      await deployHatsModuleFactory(Hats.address);
    HatsModuleFactory = _HatsModuleFactory;

    [address1] = await viem.getWalletClients();
    address1Validated = validateAddress(address1);
  });

  it("factory", async () => {
    const version = await HatsModuleFactory.read.version();

    expect(version).equal("0.0.1");
  });

  it("deploy module", async () => {
    const { HatsModule: HatsModuleImpl } = await deployEmptyHatsModule();

    await Hats.write.mintTopHat([
      address1Validated,
      "Description",
      "https://test.com/tophat.png",
    ]);

    const topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );

    await HatsModuleFactory.write.createHatsModule([
      HatsModuleImpl.address,
      topHatId,
      "0x",
      "0x",
      BigInt(0),
    ]);

    expect(
      await HatsModuleFactory.read.deployed([
        HatsModuleImpl.address,
        topHatId,
        "0x",
        BigInt(0),
      ]),
    ).equal(true);

    const moduleAddress = await HatsModuleFactory.read.getHatsModuleAddress([
      HatsModuleImpl.address,
      topHatId,
      "0x",
      BigInt(0),
    ]);

    const module = await viem.getContractAt("HatsModule", moduleAddress);

    expect((await module.read.IMPLEMENTATION()).toLowerCase()).equal(
      HatsModuleImpl.address,
    );
  });
});
