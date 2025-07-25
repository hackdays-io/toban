import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { viem } from "hardhat";
import type { Address, PublicClient, WalletClient } from "viem";
import { decodeEventLog, encodeAbiParameters } from "viem";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsTimeFrameModule,
} from "../helpers/deploy/Hats";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";

describe("HatsTimeFrameModule", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsTimeFrameModule: HatsTimeFrameModule;
  let address1: WalletClient;
  let address2: WalletClient;
  let address1Validated: Address;
  let address2Validated: Address;

  let topHatId: bigint;
  let operatorTobanId: bigint;
  let timeFrameTobanId: bigint;
  let creatorTobanId: bigint;

  let roleHatId: bigint | undefined;

  let publicClient: PublicClient;

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) {
      throw new Error("Wallet client account address is undefined");
    }
    return client.account.address;
  };

  const createHat = async (
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

  before(async () => {
    const { Create2Deployer: _Create2Deployer } = await deployCreate2Deployer();
    Create2Deployer = _Create2Deployer;

    const { Hats: _Hats } = await deployHatsProtocol();
    const { HatsModuleFactory: _HatsModuleFactory } =
      await deployHatsModuleFactory(_Hats.address);
    const { HatsTimeFrameModule: _HatsTimeFrameModule } =
      await deployHatsTimeFrameModule("0.0.0", Create2Deployer.address);

    Hats = _Hats;
    HatsModuleFactory = _HatsModuleFactory;
    HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

    [address1, address2] = await viem.getWalletClients();
    address1Validated = validateAddress(address1);
    address2Validated = validateAddress(address2);

    await Hats.write.mintTopHat([
      address1Validated,
      "Description",
      "https://test.com/tophat.png",
    ]);

    topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );
    publicClient = await viem.getPublicClient();

    // Operator Tobanを作成
    operatorTobanId = await createHat(publicClient, topHatId, "OperatorToban");
    timeFrameTobanId = await createHat(
      publicClient,
      operatorTobanId,
      "TimeFrameToban",
    );
  });

  it("deploy time frame module", async () => {
    const initData = encodeAbiParameters(
      [{ type: "uint256" }],
      [timeFrameTobanId],
    );
    // HatsModuleインスタンスをデプロイ
    await HatsModuleFactory.write.createHatsModule([
      HatsTimeFrameModule_IMPL.address,
      topHatId,
      "0x",
      initData,
      BigInt(0),
    ]);

    const moduleAddress = await HatsModuleFactory.read.getHatsModuleAddress([
      HatsTimeFrameModule_IMPL.address,
      topHatId,
      "0x",
      BigInt(0),
    ]);

    HatsTimeFrameModule = await viem.getContractAt(
      "HatsTimeFrameModule",
      moduleAddress,
    );

    expect(
      (await HatsTimeFrameModule.read.IMPLEMENTATION()).toLowerCase(),
    ).equal(HatsTimeFrameModule_IMPL.address.toLowerCase());

    // Hatter Hatを作成
    let hatterHatId = await createHat(publicClient, topHatId, "");
    // Hatter HatをTimeFrameModuleにミント
    await Hats.write.mintHat([hatterHatId, HatsTimeFrameModule.address]);

    // Role hat をCreate
    roleHatId = await createHat(publicClient, hatterHatId, "Role Hat");
  });

  it("mint hat", async () => {
    if (!roleHatId) {
      throw new Error("Role hat ID is undefined");
    }

    const initialTime = BigInt(await time.latest());

    await HatsTimeFrameModule.write.mintHat([roleHatId, address1Validated, 0n]);

    const afterMintTime = BigInt(await time.latest());

    let woreTime = await HatsTimeFrameModule.read.getWoreTime([
      address1Validated,
      roleHatId,
    ]);

    expect(woreTime).to.equal(afterMintTime);

    await time.increaseTo(initialTime + 100n);

    const currentTime1 = BigInt(await time.latest());

    let expectedElapsedTime = currentTime1 - woreTime + 1n;

    let elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
      address1Validated,
      roleHatId,
    ]);

    expect(elapsedTime).to.equal(expectedElapsedTime);

    await time.increaseTo(initialTime + 200n);

    const currentTime2 = BigInt(await time.latest());

    expectedElapsedTime = currentTime2 - woreTime + 1n;

    elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
      address1Validated,
      roleHatId,
    ]);

    expect(elapsedTime).to.equal(expectedElapsedTime);

    await HatsTimeFrameModule.write.deactivate([roleHatId, address1Validated]);

    const afterDeactivateTime = BigInt(await time.latest());

    const totalActiveTimeAfterDeactivation = afterDeactivateTime - woreTime;

    expectedElapsedTime = totalActiveTimeAfterDeactivation;

    // Increase time to initialTime + 250 seconds (during inactivity)
    await time.increaseTo(initialTime + 250n);

    // Elapsed time should remain the same
    elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
      address1Validated,
      roleHatId,
    ]);

    expect(elapsedTime).to.equal(expectedElapsedTime);

    // Reactivate the hat
    await HatsTimeFrameModule.write.reactivate([roleHatId, address1Validated]);

    // Get woreTime after reactivation
    woreTime = BigInt(await time.latest());

    await time.increaseTo(initialTime + 350n);

    const currentTime3 = BigInt(await time.latest());

    expectedElapsedTime =
      totalActiveTimeAfterDeactivation + (currentTime3 - woreTime) + 1n;

    elapsedTime = await HatsTimeFrameModule.read.getWearingElapsedTime([
      address1Validated,
      roleHatId,
    ]);

    expect(elapsedTime).to.equal(expectedElapsedTime);
  });

  it("mint hat previous time", async () => {
    if (!roleHatId) {
      throw new Error("Role hat ID is undefined");
    }

    const initialTime = BigInt(await time.latest());
    await time.increaseTo(initialTime + 10000n);

    await HatsTimeFrameModule.write.mintHat([
      roleHatId,
      address2Validated,
      initialTime + 5000n,
    ]);

    const woreTime = await HatsTimeFrameModule.read.getWoreTime([
      address2Validated,
      roleHatId,
    ]);

    expect(woreTime).to.equal(initialTime + 5000n);
  });

  it("renouce hat", async () => {
    if (!roleHatId) {
      throw new Error("Role hat ID is undefined");
    }

    expect(await Hats.read.balanceOf([address1Validated, roleHatId])).to.equal(
      1n,
    );

    await HatsTimeFrameModule.write.renounce([roleHatId, address1Validated]);

    expect(await Hats.read.balanceOf([address1Validated, roleHatId])).to.equal(
      0n,
    );
    expect(
      await Hats.read.balanceOf([HatsTimeFrameModule.address, roleHatId]),
    ).to.equal(0n);

    const woreTime = await HatsTimeFrameModule.read.getWoreTime([
      address1Validated,
      roleHatId,
    ]);

    expect(woreTime).to.equal(0n);
  });
});
