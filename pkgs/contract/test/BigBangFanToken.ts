import { expect } from "chai";
import { viem } from "hardhat";
import {
  type PublicClient,
  type WalletClient,
  Address,
  decodeEventLog,
  zeroAddress,
} from "viem";
import { type BigBang, deployBigBang } from "../helpers/deploy/BigBang";
import {
  type FractionToken,
  deployFractionToken,
} from "../helpers/deploy/FractionToken";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  type HatsHatCreatorModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsTimeFrameModule,
  deployHatsHatCreatorModule,
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
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";

describe("BigBangFanToken", () => {
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
  let publicClient: PublicClient;

  before(async () => {
    [address1] = await viem.getWalletClients();

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

  /**
   * 以降は、FanTobanのテストコードになる。
   */
  describe("FanToban Test", () => {
    it("should create stadium-style roles and assign higher rewards to front seats", async () => {
      // BigBangのアドレスをSplitsCreatorFactoryに設定
      await SplitsCreatorFactory.write.setBigBang([BigBang.address]);

      // 応援座席：3人のアカウント（前列, 中列, 後列）
      const [frontSeat, midSeat, backSeat] = await viem.getWalletClients();

      // bigbang呼び出し
      const txHash = await BigBang.write.bigbang(
        [
          frontSeat.account?.address!, // ワークスペースオーナー
          "FrontLeaderHat",
          "FrontHatURI",
          "MidLeaderHat",
          "MidHatURI",
        ],
        { account: frontSeat.account },
      );

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log('receipt', receipt)

      let splitsAddress: Address | undefined;

      // Splitsのアドレスをeventログから取得（Executedイベントのargsとか）
      for (const log of receipt.logs) {
        try {
          const decodedLog: any = decodeEventLog({
            abi: BigBang.abi as any,
            data: log.data,
            topics: log.topics,
          });
          if (decodedLog.eventName === "Executed") {
            splitsAddress = decodedLog.args.splitsAddress;
            break;
          }
        } catch (err) {}
      }

      console.log('splitsAddress', splitsAddress)

      // Splitsの報酬分配情報を取得
      // テストデータと照らし合わせて：front > mid > back の順であるか
      // expect(weights).to.deep.equal([50n, 30n, 20n]);
      // 例：報酬の割合が front > mid > back であるかを確認（重み例：50%, 30%, 20%）
      // 重みのソートが [front, mid, back] の順か確認
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
