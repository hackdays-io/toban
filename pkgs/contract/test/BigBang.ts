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
  type ThanksToken,
  type ThanksTokenFactory,
  deployThanksToken,
  deployThanksTokenFactory,
} from "../helpers/deploy/ThanksToken";
import {
  type Hats,
  type HatsModuleFactory,
  type HatsTimeFrameModule,
  type HatsHatCreatorModule,
  type HatsFractionTokenModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  deployHatsTimeFrameModule,
  deployHatsHatCreatorModule,
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
import { upgradeBigBang } from "../helpers/upgrade/bigbang";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";

describe("BigBang", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let HatsHatCreatorModule_IMPL: HatsHatCreatorModule;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitsFactory;
  let PushSplitsFactory: PushSplitsFactory;
  let SplitsCreatorFactory: SplitsCreatorFactory;
  let SplitsCreator_IMPL: SplitsCreator;
  let ThanksToken_IMPL: ThanksToken;
  let ThanksTokenFactory: ThanksTokenFactory;
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
      await deployHatsTimeFrameModule(undefined, Create2Deployer.address);
    HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

    const { HatsHatCreatorModule: _HatsHatCreatorModule } =
      await deployHatsHatCreatorModule(undefined, Create2Deployer.address);
    HatsHatCreatorModule_IMPL = _HatsHatCreatorModule;

    const { HatsFractionTokenModule: _HatsFractionTokenModule_IMPL } =
      await deployHatsFractionTokenModule("0.0.0", Create2Deployer.address);
    HatsFractionTokenModule_IMPL = _HatsFractionTokenModule_IMPL;

    const {
      SplitsWarehouse: _SplitsWarehouse,
      PullSplitsFactory: _PullSplitsFactory,
      PushSplitsFactory: _PushSplitsFactory,
    } = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

    const { ThanksToken: _ThanksToken } = await deployThanksToken(
      {
        initialOwner: await address1
          .getAddresses()
          .then((addresses) => addresses[0]),
        name: "Test Thanks Token",
        symbol: "TTT",
        hatsAddress: Hats.address,
        fractionTokenAddress: HatsFractionTokenModule_IMPL.address,
        hatsTimeFrameModuleAddress: HatsTimeFrameModule_IMPL.address,
        defaultCoefficient: 1000000000000000000n, // 1.0 in wei
      },
      Create2Deployer.address,
    );
    ThanksToken_IMPL = _ThanksToken;

    const { ThanksTokenFactory: _ThanksTokenFactory } =
      await deployThanksTokenFactory(
        {
          initialOwner: await address1
            .getAddresses()
            .then((addresses) => addresses[0]),
          implementation: ThanksToken_IMPL.address,
          hatsAddress: Hats.address,
          fractionTokenAddress: HatsFractionTokenModule_IMPL.address,
          hatsTimeFrameModuleAddress: HatsTimeFrameModule_IMPL.address,
        },
        Create2Deployer.address,
      );
    ThanksTokenFactory = _ThanksTokenFactory;

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
        hatsFractionTokenModule_impl: HatsFractionTokenModule_IMPL.address,
        splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
        splitsFactoryV2Address: PullSplitsFactory.address,
        thanksTokenFactoryAddress: ThanksTokenFactory.address,
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

    // ThanksTokenFactoryにBigBangアドレスをセット
    await ThanksTokenFactory.write.setBigBang([BigBang.address]);

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
          expect(decodedLog.args.memberHatId).to.be.not.equal(null);
          Hats.read.isWearerOfHat([
            decodedLog.args.memberHatId,
            BigInt(address1.account?.address!),
          ]);
          console.log(decodedLog.args);
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
    const oldFractionTokenAddress = HatsFractionTokenModule_IMPL.address;
    const newFractionTokenAddress = address1.account?.address!;
    const ownerAccount = address1.account;

    expect(
      (await BigBang.read.HatsFractionTokenModule_IMPL()).toLowerCase(),
    ).equal(oldFractionTokenAddress.toLowerCase());

    await BigBang.write.setHatsFractionTokenModuleImpl(
      [newFractionTokenAddress],
      {
        account: ownerAccount,
      },
    );

    expect(
      (await BigBang.read.HatsFractionTokenModule_IMPL()).toLowerCase(),
    ).equal(newFractionTokenAddress.toLowerCase());

    await BigBang.write.setHatsFractionTokenModuleImpl(
      [oldFractionTokenAddress],
      {
        account: ownerAccount,
      },
    );

    expect(
      (await BigBang.read.HatsFractionTokenModule_IMPL()).toLowerCase(),
    ).equal(oldFractionTokenAddress.toLowerCase());
  });

  // /**
  //  * 以降は、Upgradeのテストコードになる。
  //  * Upgrade後に再度機能をテストする。
  //  */
  // describe("Upgrade Test", () => {
  //   it("upgrde", async () => {
  //     // BigBangをアップグレード
  //     const { UpgradedBigBang } = await upgradeBigBang(
  //       BigBang.address,
  //       "BigBang_Mock_v2",
  //       Create2Deployer.address,
  //     );

  //     // upgrade後にしかないメソッドを実行
  //     const result = await UpgradedBigBang.read.testUpgradeFunction();
  //     expect(result).to.equal("testUpgradeFunction");
  //   });

  //   it("should execute bigbang after upgrade", async () => {
  //     // BigBangをアップグレード
  //     const { UpgradedBigBang } = await upgradeBigBang(
  //       BigBang.address,
  //       "BigBang_Mock_v2",
  //       Create2Deployer.address,
  //     );

  //     // SplitsCreatorFactoryにBigBangアドレスをセット
  //     SplitsCreatorFactory.write.setBigBang([UpgradedBigBang.address]);

  //     const txHash = await UpgradedBigBang.write.bigbang(
  //       [
  //         address1.account?.address!,
  //         "tophatDetails",
  //         "tophatURI",
  //         "hatterhatDetails",
  //         "hatterhatURI",
  //       ],
  //       { account: address1.account },
  //     );

  //     const receipt = await publicClient.waitForTransactionReceipt({
  //       hash: txHash,
  //     });

  //     for (const log of receipt.logs) {
  //       try {
  //         const decodedLog: any = decodeEventLog({
  //           abi: UpgradedBigBang.abi as any,
  //           data: log.data,
  //           topics: log.topics,
  //         });
  //         if (decodedLog.eventName == "Executed") {
  //           expect(decodedLog.args.owner.toLowerCase()).to.be.equal(
  //             address1.account?.address!,
  //           );
  //         }
  //       } catch (error) {}
  //     }
  //   });
  // });
});
