import { expect } from "chai";
import { viem } from "hardhat";
import type { Address, PublicClient, WalletClient } from "viem";
import { decodeEventLog, encodeAbiParameters } from "viem";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsHatCreatorModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsHatCreatorModule,
} from "../helpers/deploy/Hats";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";

describe("HatsHatCreatorModule", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsHatCreatorModule_IMPL: HatsHatCreatorModule;
  let HatsHatCreatorModule: HatsHatCreatorModule;
  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let address1Validated: Address;
  let address2Validated: Address;
  let address3Validated: Address;

  let topHatId: bigint;
  let operatorTobanId: bigint;
  let hatCreatorTobanId: bigint;
  let hatterHatId: bigint;

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

    let hatId;
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

    Hats = _Hats;
    HatsModuleFactory = _HatsModuleFactory;

    [address1, address2, address3] = await viem.getWalletClients();
    address1Validated = validateAddress(address1);
    address2Validated = validateAddress(address2);
    address3Validated = validateAddress(address3);

    await Hats.write.mintTopHat([
      address1Validated,
      "Description",
      "https://test.com/tophat.png",
    ]);

    topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );

    const { HatsHatCreatorModule: _HatsHatCreatorModule } =
      await deployHatsHatCreatorModule(
        address1Validated,
        "0.0.0",
        Create2Deployer.address,
      );
    HatsHatCreatorModule_IMPL = _HatsHatCreatorModule;

    publicClient = await viem.getPublicClient();

    operatorTobanId = await createHat(publicClient, topHatId, "OperatorToban");
    hatCreatorTobanId = await createHat(
      publicClient,
      operatorTobanId,
      "HatCreatorToban",
    );
  });

  describe("deploy hat creator module", () => {
    it("deploy hat creator module", async () => {
      // オーナーアドレスをエンコード
      const initData = encodeAbiParameters(
        [{ type: "address" }, { type: "uint256" }],
        [address1Validated, hatCreatorTobanId],
      );

      // HatsModuleインスタンスをデプロイ
      await HatsModuleFactory.write.createHatsModule([
        HatsHatCreatorModule_IMPL.address,
        topHatId,
        "0x", // otherImmutableArgs
        initData, // 初期化データとしてオーナーアドレスを渡す
        BigInt(0),
      ]);

      const moduleAddress = await HatsModuleFactory.read.getHatsModuleAddress([
        HatsHatCreatorModule_IMPL.address,
        topHatId,
        "0x",
        BigInt(0),
      ]);

      HatsHatCreatorModule = await viem.getContractAt(
        "HatsHatCreatorModule",
        moduleAddress,
      );

      expect(
        (await HatsHatCreatorModule.read.IMPLEMENTATION()).toLowerCase(),
      ).equal(HatsHatCreatorModule_IMPL.address.toLowerCase());

      // Hatter Hatを作成
      hatterHatId = await createHat(publicClient, topHatId, "");

      // Hatter HatをHatCreatorModuleにミント
      await Hats.write.mintHat([hatterHatId, HatsHatCreatorModule.address]);

      // #YF operatorTobanをHatCreatorModuleにミント
      // await Hats.write.mintHat([operatorTobanId, HatsHatCreatorModule.address]);
    });

    it("check owner", async () => {
      const owner = (await HatsHatCreatorModule.read.owner()).toLowerCase();
      expect(owner).to.equal(address1Validated.toLowerCase());
    });

    it("check createHatAuthorities are false", async () => {
      let checkCreateHatAuthority;

      checkCreateHatAuthority =
        await HatsHatCreatorModule.read.hasCreateHatAuthority([
          address1Validated,
        ]);
      expect(checkCreateHatAuthority).to.be.true;

      checkCreateHatAuthority =
        await HatsHatCreatorModule.read.hasCreateHatAuthority([
          address2Validated,
        ]);
      expect(checkCreateHatAuthority).to.be.false;

      checkCreateHatAuthority =
        await HatsHatCreatorModule.read.hasCreateHatAuthority([
          address3Validated,
        ]);
      expect(checkCreateHatAuthority).to.be.false;
    });

    it("check HatsHatCreatorModule wears Hatter Hat", async () => {
      // hatterHatIdが定義されていることを確認
      if (!hatterHatId) {
        throw new Error("Hatter hat ID not found");
      }

      // HatsHatCreatorModuleがHatterHatを所有しているか確認
      const isWearer = await Hats.read.isWearerOfHat([
        HatsHatCreatorModule.address,
        hatterHatId,
      ]);
      expect(isWearer).to.be.true;
    });

    // // #YF TODO ここでhatCreatorTobanをHatsHatCreatorModuleにミントする必要があるかもしれない
    // it("check HatsHatCreatorModule wears HatCreatorToban Toban", async () => {
    //   // hatterHatIdが定義されていることを確認
    //   if (!hatCreatorTobanId) {
    //     throw new Error("Hatter hat ID not found");
    //   }

    //   // HatsHatCreatorModuleがHatterHatを所有しているか確認
    //   const isWearer = await Hats.read.isWearerOfHat([
    //     HatsHatCreatorModule.address,
    //     hatCreatorTobanId,
    //   ]);
    //   expect(isWearer).to.be.true;
    // });
  });

  describe("create hat authority", () => {
    it("grant create hat authority", async () => {
      let hasAuthority;

      // #YF isn't HatCreatorModule ownership moved to address1?
      // hasAuthority = await HatsHatCreatorModule.read.hasCreateHatAuthority([
      //   HatsHatCreatorModule.address,
      // ]);

      // expect(hasAuthority).to.be.true;

      hasAuthority = await HatsHatCreatorModule.read.hasCreateHatAuthority([
        address2Validated,
      ]);
      expect(hasAuthority).to.be.false;

      await Hats.write.mintHat([hatCreatorTobanId, address2Validated]);

      hasAuthority = await HatsHatCreatorModule.read.hasCreateHatAuthority([
        address2Validated,
      ]);
      expect(hasAuthority).to.be.true;

      try {
        await Hats.write.mintHat([hatCreatorTobanId, address2Validated]),
          expect.fail("Should have thrown AlreadyWearingHat error");
      } catch (error: any) {
        expect(error.message).to.include("AlreadyWearingHat");
        expect(error.message).to.include(address2Validated);
      }
    });

    it("revoke create hat authority", async () => {
      let hasAuthority;
      hasAuthority = await HatsHatCreatorModule.read.hasCreateHatAuthority([
        address2Validated,
      ]);
      expect(hasAuthority).to.be.true;
      //#YF TODO  権限を剥奪

      // hasAuthority = await HatsHatCreatorModule.read.hasCreateHatAuthority([
      //   address2Validated,
      // ]);
      // expect(hasAuthority).to.be.false;
    });
  });

  describe("create hat with authority", () => {
    it("create hat with authority", async () => {
      // 権限を付与
      Hats.write.mintHat([hatCreatorTobanId, address2Validated]);

      // 権限を持つアドレスからのhat作成
      const hatDetails = "Test Hat";
      const maxSupply = 10;
      const eligibility = "0x0000000000000000000000000000000000004a75";
      const toggle = "0x0000000000000000000000000000000000004a75";
      const mutable = true;
      const imageURI = "https://test.com/hat.png";

      const createHatTx = await HatsHatCreatorModule.write.createHat(
        [
          hatterHatId,
          hatDetails,
          maxSupply,
          eligibility,
          toggle,
          mutable,
          imageURI,
        ],
        { account: address2.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: createHatTx,
      });
      expect(receipt.status).to.equal("success");
    });
  });

  describe("edge cases", () => {
    it("should fail when unauthorized address tries to create hat", async () => {
      // 権限のないアドレスからのhat作成試行
      await expect(
        HatsHatCreatorModule.write.createHat(
          [
            topHatId,
            "Test Hat",
            10,
            "0x0000000000000000000000000000000000004a75",
            "0x0000000000000000000000000000000000004a75",
            true,
            "https://test.com/hat.png",
          ],
          { account: address3.account },
        ),
      ).to.be.rejectedWith("Not authorized");
    });
  });
});
