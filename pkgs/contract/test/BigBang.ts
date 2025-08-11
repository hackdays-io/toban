import { expect } from "chai";
import { viem } from "hardhat";
import {
  Address,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
} from "viem";
import { type BigBang, deployBigBang } from "../helpers/deploy/BigBang";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";
import {
  type FractionToken,
  deployFractionToken,
} from "../helpers/deploy/FractionToken";
import {
  type Hats,
  type HatsHatCreatorModule,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  deployHatsHatCreatorModule,
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
import { upgradeBigBang } from "../helpers/upgrade/bigbang";

describe("BigBang", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsHatCreatorModule_IMPL: HatsHatCreatorModule;
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitsFactory;
  let PushSplitsFactory: PushSplitsFactory;
  let SplitsCreatorFactory: SplitsCreatorFactory;
  let SplitsCreator_IMPL: SplitsCreator;
  let FractionToken: FractionToken;
  let BigBang: BigBang;

  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let address4: WalletClient;
  let publicClient: PublicClient;
  let testClient: any;

  before(async () => {
    [address1, address2, address3, address4] = await viem.getWalletClients();

    const { Create2Deployer: _Create2Deployer } = await deployCreate2Deployer();
    Create2Deployer = _Create2Deployer;

    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    const { HatsModuleFactory: _HatsModuleFactory } =
      await deployHatsModuleFactory(Hats.address);
    HatsModuleFactory = _HatsModuleFactory;

    const { HatsTimeFrameModule: _HatsTimeFrameModule } =
      await deployHatsTimeFrameModule(
        "0x0000000000000000000000000000000000000001",
        undefined,
        Create2Deployer.address,
      );
    HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

    const { HatsHatCreatorModule: _HatsHatCreatorModule } =
      await deployHatsHatCreatorModule(
        "0x0000000000000000000000000000000000000001",
        undefined,
        Create2Deployer.address,
      ); // zero address 以外のアドレスを仮に渡す
    HatsHatCreatorModule_IMPL = _HatsHatCreatorModule;

    const {
      SplitsWarehouse: _SplitsWarehouse,
      PullSplitsFactory: _PullSplitsFactory,
      PushSplitsFactory: _PushSplitsFactory,
    } = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

    const { FractionToken: _FractionToken } = await deployFractionToken(
      "",
      10000n,
      Hats.address,
      Create2Deployer.address,
    );
    FractionToken = _FractionToken;

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

    publicClient = await viem.getPublicClient();
    testClient = await viem.getTestClient();
  });

  it("should deploy BigBang", async () => {
    const { BigBang: _BigBang } = await deployBigBang(
      {
        hatsContractAddress: Hats.address,
        hatsModuleFacotryAddress: HatsModuleFactory.address,
        hatsTimeFrameModule_impl: HatsTimeFrameModule_IMPL.address,
        hatsHatCreatorModule_impl: HatsHatCreatorModule_IMPL.address,
        splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
        splitsFactoryV2Address: PullSplitsFactory.address,
        fractionTokenAddress: FractionToken.address,
      },
      Create2Deployer.address,
    );

    expect(_BigBang.address).to.not.be.undefined;

    BigBang = _BigBang;

    expect((await BigBang.read.owner()).toLowerCase()).to.equal(
      address1.account?.address,
    );
  });

  it("should execute bigbang", async () => {
    // SplitsCreatorFactoryにBigBangアドレスをセット
    await SplitsCreatorFactory.write.setBigBang([BigBang.address]);

    const txHash = await BigBang.write.bigbang(
      [
        address1.account?.address!,
        "tophatDetails",
        "tophatURI",
        "hatterhatDetails",
        "hatterhatURI",
      ],
      { account: address1.account },
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    for (const log of receipt.logs) {
      try {
        const decodedLog: any = decodeEventLog({
          abi: BigBang.abi as any,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName == "Executed") {
          expect(decodedLog.args.owner.toLowerCase()).to.be.equal(
            address1.account?.address!,
          );
        }
      } catch (error) {}
    }
  });

  it("should set new hats address", async () => {
    const oldHatsAddress = Hats.address;
    const newHatsAddress = address1.account?.address!;
    const ownerAccount = address1.account;

    expect((await BigBang.read.Hats()).toLowerCase()).equal(oldHatsAddress);

    await BigBang.write.setHats([newHatsAddress], {
      account: ownerAccount,
    });

    expect((await BigBang.read.Hats()).toLowerCase()).equal(newHatsAddress);

    await BigBang.write.setHats([oldHatsAddress], {
      account: ownerAccount,
    });

    expect((await BigBang.read.Hats()).toLowerCase()).equal(oldHatsAddress);
  });

  it("should set new hats module factory address", async () => {
    const oldHatsModuleFactoryAddress = HatsModuleFactory.address;
    const newHatsModuleFactoryAddress = address1.account?.address!;
    const ownerAccount = address1.account;

    expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).equal(
      oldHatsModuleFactoryAddress,
    );

    await BigBang.write.setHatsModuleFactory([newHatsModuleFactoryAddress], {
      account: ownerAccount,
    });

    expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).equal(
      newHatsModuleFactoryAddress,
    );

    await BigBang.write.setHatsModuleFactory([oldHatsModuleFactoryAddress], {
      account: ownerAccount,
    });

    expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).equal(
      oldHatsModuleFactoryAddress,
    );
  });

  it("should set new splits creator factory address", async () => {
    const oldSplitsCreatorFactoryAddress = SplitsCreatorFactory.address;
    const newSplitsCreatorFactoryAddress = address1.account?.address!;
    const ownerAccount = address1.account;

    expect(await BigBang.read.SplitsCreatorFactory()).equal(
      oldSplitsCreatorFactoryAddress,
    );

    await BigBang.write.setSplitsCreatorFactory(
      [newSplitsCreatorFactoryAddress],
      {
        account: ownerAccount,
      },
    );

    expect((await BigBang.read.SplitsCreatorFactory()).toLowerCase()).equal(
      newSplitsCreatorFactoryAddress,
    );

    await BigBang.write.setSplitsCreatorFactory(
      [oldSplitsCreatorFactoryAddress],
      {
        account: ownerAccount,
      },
    );

    expect(await BigBang.read.SplitsCreatorFactory()).equal(
      oldSplitsCreatorFactoryAddress,
    );
  });

  it("should set new hats time frame module address", async () => {
    const oldHatsTimeFrameModuleAddress = HatsTimeFrameModule_IMPL.address;
    const newHatsTimeFrameModuleAddress = address1.account?.address!;
    const ownerAccount = address1.account;

    expect((await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()).equal(
      oldHatsTimeFrameModuleAddress.toLowerCase(),
    );

    await BigBang.write.setHatsTimeFrameModuleImpl(
      [newHatsTimeFrameModuleAddress],
      {
        account: ownerAccount,
      },
    );

    expect((await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()).equal(
      newHatsTimeFrameModuleAddress.toLowerCase(),
    );

    await BigBang.write.setHatsTimeFrameModuleImpl(
      [oldHatsTimeFrameModuleAddress],
      {
        account: ownerAccount,
      },
    );

    expect((await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()).equal(
      oldHatsTimeFrameModuleAddress.toLowerCase(),
    );
  });

  it("should set new splits factory v2 address", async () => {
    const oldSplitsFactoryV2Address = PullSplitsFactory.address;
    const newSplitsFactoryV2Address = address1.account?.address!;
    const ownerAccount = address1.account;

    expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).equal(
      oldSplitsFactoryV2Address.toLowerCase(),
    );

    await BigBang.write.setSplitsFactoryV2([newSplitsFactoryV2Address], {
      account: ownerAccount,
    });

    expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).equal(
      newSplitsFactoryV2Address.toLowerCase(),
    );

    await BigBang.write.setSplitsFactoryV2([oldSplitsFactoryV2Address], {
      account: ownerAccount,
    });

    expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).equal(
      oldSplitsFactoryV2Address.toLowerCase(),
    );
  });

  it("should set new fraction token address", async () => {
    const oldFractionTokenAddress = FractionToken.address;
    const newFractionTokenAddress = address1.account?.address!;
    const ownerAccount = address1.account;

    expect((await BigBang.read.FractionToken()).toLowerCase()).equal(
      oldFractionTokenAddress.toLowerCase(),
    );

    await BigBang.write.setFractionToken([newFractionTokenAddress], {
      account: ownerAccount,
    });

    expect((await BigBang.read.FractionToken()).toLowerCase()).equal(
      newFractionTokenAddress.toLowerCase(),
    );

    await BigBang.write.setFractionToken([oldFractionTokenAddress], {
      account: ownerAccount,
    });

    expect((await BigBang.read.FractionToken()).toLowerCase()).equal(
      oldFractionTokenAddress.toLowerCase(),
    );
  });

  describe("batchMintHatsToWearers", () => {
    // テスト用変数の定義
    let topHatId: bigint; // トップハットのID
    let hatterHatId: bigint; // ハッターハットのID
    let testChildHatId: bigint; // テスト用子ハットのID（十分な供給量を持つ）
    let testWearers: Address[]; // テスト用のハット着用者アドレス

    before(async () => {
      // テスト用の着用者アドレスを設定
      testWearers = [address2.account?.address!, address3.account?.address!];

      // SplitsCreatorFactoryにBigBangアドレスを設定（必要な初期化）
      await SplitsCreatorFactory.write.setBigBang([BigBang.address]);

      // テスト用の新しいプロジェクトを作成するためにbigbangメソッドを実行
      const txHash = await BigBang.write.bigbang(
        [
          address1.account?.address!, // オーナーとしてaddress1を使用
          "batchTest_tophatDetails",
          "batchTest_tophatURI",
          "batchTest_hatterhatDetails",
          "batchTest_hatterhatURI",
        ],
        { account: address1.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      // bigbang実行結果からトップハットIDとハッターハットIDを抽出
      for (const log of receipt.logs) {
        try {
          const decodedLog: any = decodeEventLog({
            abi: BigBang.abi as any,
            data: log.data,
            topics: log.topics,
          });
          if (decodedLog.eventName === "Executed") {
            topHatId = decodedLog.args.topHatId;
            hatterHatId = decodedLog.args.hatterHatId;
            break;
          }
        } catch (error) {}
      }

      // BigBangが子ハットの管理者として機能できるように、トップハットをBigBangに移譲
      await Hats.write.transferHat(
        [topHatId, address1.account?.address!, BigBang.address],
        { account: address1.account },
      );

      // BigBangアドレスを偽装してHatsコントラクトにアクセスできるようにする
      await testClient.impersonateAccount({
        address: BigBang.address,
      });

      // BigBangアドレスにトランザクション実行用のETHを送金
      await testClient.setBalance({
        address: BigBang.address,
        value: BigInt(10) * BigInt(10 ** 18), // 10 ETH
      });

      // テスト用の子ハットを作成（maxSupply=10で十分な供給量を確保）
      const childHatTxHash = await Hats.write.createHat(
        [
          topHatId, // 管理者ハット
          "Test Child Hat Details",
          10, // maxSupply（テストに十分な数量）
          address1.account?.address!, // 適格性チェック用アドレス
          address1.account?.address!, // トグル機能用アドレス
          true, // 変更可能フラグ
          "testChildHatImageURI",
        ],
        { account: BigBang.address },
      );

      const childHatReceipt = await publicClient.waitForTransactionReceipt({
        hash: childHatTxHash,
      });

      // 作成された子ハットのIDをイベントから抽出
      for (const log of childHatReceipt.logs) {
        try {
          const decodedLog: any = decodeEventLog({
            abi: Hats.abi as any,
            data: log.data,
            topics: log.topics,
          });
          if (decodedLog.eventName === "HatCreated") {
            testChildHatId = decodedLog.args.id;
            break;
          }
        } catch (error) {}
      }

      // 子ハットIDが正常に取得できたことを確認
      expect(testChildHatId).to.not.be.undefined;
    });

    it("should successfully batch mint hats to wearers", async () => {
      // テスト用のハットIDと着用者を準備
      const hatIds = [testChildHatId, testChildHatId];
      const wearers = testWearers;

      // 初期状態で着用者がハットを持っていないことを確認
      for (const wearer of wearers) {
        expect(await Hats.read.balanceOf([wearer, testChildHatId])).to.equal(
          0n,
        );
      }

      // batchMintHatsToWearersメソッドを実行
      const txHash = await BigBang.write.batchMintHatsToWearers(
        [hatIds, wearers],
        { account: address1.account },
      );

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // 実行後に着用者がハットを持っていることを確認
      for (const wearer of wearers) {
        expect(await Hats.read.balanceOf([wearer, testChildHatId])).to.equal(
          1n,
        );
      }
    });

    it("should revert when array lengths don't match", async () => {
      // 配列の長さが一致しないケースをテスト（ハットID: 1個、着用者: 2個）
      const hatIds = [testChildHatId];
      const wearers = testWearers; // 2つのアドレスだが、ハットIDは1つのみ

      // 配列の長さが一致しない場合にエラーが発生することを確認
      await expect(
        BigBang.write.batchMintHatsToWearers([hatIds, wearers], {
          account: address1.account,
        }),
      ).to.be.rejectedWith("Array lengths must match");
    });

    it("should revert when called by non-owner", async () => {
      // オーナー以外がメソッドを呼び出した場合のテスト
      const hatIds = [testChildHatId, testChildHatId];
      const wearers = testWearers;

      // 非オーナー（address2）からの実行でアクセス制御エラーが発生することを確認
      await expect(
        BigBang.write.batchMintHatsToWearers([hatIds, wearers], {
          account: address2.account,
        }),
      ).to.be.rejectedWith("OwnableUnauthorizedAccount");
    });

    it("should handle empty arrays", async () => {
      // 空の配列を渡した場合の処理テスト
      const hatIds: bigint[] = [];
      const wearers: Address[] = [];

      // 空の配列でもエラーが発生しないことを確認
      const txHash = await BigBang.write.batchMintHatsToWearers(
        [hatIds, wearers],
        { account: address1.account },
      );

      await publicClient.waitForTransactionReceipt({ hash: txHash });
    });

    it("should handle single hat mint", async () => {
      // 単一のハットミントのテスト
      const hatIds = [testChildHatId];
      const wearers = [address4.account?.address!];

      // 初期状態で着用者がハットを持っていないことを確認
      expect(await Hats.read.balanceOf([wearers[0], testChildHatId])).to.equal(
        0n,
      );

      // 単一のアイテムでbatchMintHatsToWearersを実行
      const txHash = await BigBang.write.batchMintHatsToWearers(
        [hatIds, wearers],
        { account: address1.account },
      );

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // 実行後に着用者がハットを持っていることを確認
      expect(await Hats.read.balanceOf([wearers[0], testChildHatId])).to.equal(
        1n,
      );
    });
  });

  /**
   * 以降は、Upgradeのテストコードになる。
   * Upgrade後に再度機能をテストする。
   */
  describe("Upgrade Test", () => {
    it("upgrde", async () => {
      // BigBangをアップグレード
      const { UpgradedBigBang } = await upgradeBigBang(
        BigBang.address,
        "BigBang_Mock_v2",
        Create2Deployer.address,
      );

      // upgrade後にしかないメソッドを実行
      const result = await UpgradedBigBang.read.testUpgradeFunction();
      expect(result).to.equal("testUpgradeFunction");
    });

    it("should execute bigbang after upgrade", async () => {
      // BigBangをアップグレード
      const { UpgradedBigBang } = await upgradeBigBang(
        BigBang.address,
        "BigBang_Mock_v2",
        Create2Deployer.address,
      );

      // SplitsCreatorFactoryにBigBangアドレスをセット
      SplitsCreatorFactory.write.setBigBang([UpgradedBigBang.address]);

      const txHash = await UpgradedBigBang.write.bigbang(
        [
          address1.account?.address!,
          "tophatDetails",
          "tophatURI",
          "hatterhatDetails",
          "hatterhatURI",
        ],
        { account: address1.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      for (const log of receipt.logs) {
        try {
          const decodedLog: any = decodeEventLog({
            abi: UpgradedBigBang.abi as any,
            data: log.data,
            topics: log.topics,
          });
          if (decodedLog.eventName == "Executed") {
            expect(decodedLog.args.owner.toLowerCase()).to.be.equal(
              address1.account?.address!,
            );
          }
        } catch (error) {}
      }
    });
  });
});
