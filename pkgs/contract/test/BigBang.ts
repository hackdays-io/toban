import { expect } from "chai";
import { viem } from "hardhat";
import {
  type PublicClient,
  type WalletClient,
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

// We'll store alwaysTrueAddress for the second test ("should execute bigbang")
let alwaysTrueAddress: string = "";

describe("BigBang", () => {
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsTimeFrameModule_IMPL: HatsTimeFrameModule;
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitsFactory;
  let PushSplitsFactory: PushSplitsFactory;
  let SplitsCreatorFactory: SplitsCreatorFactory;
  let SplitsCreator_IMPL: SplitsCreator;
  let FractionToken: FractionToken;
  let BigBang: BigBang;

  let address1: WalletClient;
  let relayer: WalletClient;
  let publicClient: PublicClient;

	before(async () => {
		// 1) Deploy Hats
		const { Hats: _Hats } = await deployHatsProtocol();
		Hats = _Hats;

		// 2) Deploy HatsModuleFactory
		const { HatsModuleFactory: _HatsModuleFactory } =
			await deployHatsModuleFactory(Hats.address);
		HatsModuleFactory = _HatsModuleFactory;

		// 3) Deploy a time frame module
		const { HatsTimeFrameModule: _HatsTimeFrameModule } =
			await deployHatsTimeFrameModule();
		HatsTimeFrameModule_IMPL = _HatsTimeFrameModule;

		// 4) Deploy the Splits protocol
		const {
			SplitsWarehouse: _SplitsWarehouse,
			PullSplitsFactory: _PullSplitsFactory,
			PushSplitsFactory: _PushSplitsFactory,
		} = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

		// 5) Deploy FractionToken
		const { FractionToken: _FractionToken } = await deployFractionToken(
			"",
			10000n,
			Hats.address
		);
		FractionToken = _FractionToken;

		// 6) Deploy SplitsCreator + SplitsCreatorFactory
		const { SplitsCreator: _SplitsCreator } = await deploySplitsCreator();
		SplitsCreator_IMPL = _SplitsCreator;

		const { SplitsCreatorFactory: _SplitsCreatorFactory } =
			await deploySplitsCreatorFactory(SplitsCreator_IMPL.address);
		SplitsCreatorFactory = _SplitsCreatorFactory;

		// 7) Grab signers
		[address1, relayer] = await viem.getWalletClients();
		publicClient = await viem.getPublicClient();

		// 8) Deploy AlwaysTrueEligibility so we can pass real addresses as eligibility/toggle
		const AlwaysTrueFactory = await ethers.getContractFactory(
			"AlwaysTrueEligibility"
		);
		// connect it to an EOA we control
		const signer0 = await ethers.getSigner(address1.account!.address!);
		const alwaysTrue = await AlwaysTrueFactory.connect(signer0).deploy();
		await alwaysTrue.waitForDeployment();
		alwaysTrueAddress = await alwaysTrue.getAddress();
	});

	it("should deploy BigBang", async () => {
		// 9) Deploy BigBang with valid addresses
		const { BigBang: _BigBang } = await deployBigBang({
			hatsContractAddress: Hats.address,
			hatsModuleFacotryAddress: HatsModuleFactory.address,
			hatsTimeFrameModule_impl: HatsTimeFrameModule_IMPL.address,
			hatsHatCreatorModule_impl: zeroAddress, // not deploying a real hatsHatCreator
			splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
			splitsFactoryV2Address: PullSplitsFactory.address,
			fractionTokenAddress: FractionToken.address,
		});

    expect(_BigBang.address).to.not.be.undefined;

    BigBang = _BigBang;

		// BigBang's default owner is the first signer => address1
		expect((await BigBang.read.owner()).toLowerCase()).to.equal(
			address1.account?.address
		);
	});

	it("should execute bigbang", async () => {
		// SplitsCreatorFactoryにBigBangアドレスをセット
		await SplitsCreatorFactory.write.setBigBang([BigBang.address]);

		// make sure we have a real alwaysTrueAddress
		expect(alwaysTrueAddress, "alwaysTrueAddress is undefined").to.not.be.empty;

		const txHash = await BigBang.write.bigbang(
			[
				address1.account?.address!,
				"tophatDetails",
				"tophatURI",
				"hatterhatDetails",
				"hatterhatURI",
				alwaysTrueAddress,
				alwaysTrueAddress,
			],
			{ account: address1.account }
		);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

		for (const log of receipt.logs) {
			try {
				const decodedLog: any = decodeEventLog({
					// Must provide BigBang's ABI, e.g. import from your artifact or from BigBang.abi
					abi: BigBang.abi as any,
					data: log.data,
					topics: log.topics,
				});
				if (decodedLog.eventName == "Executed") {
					// owner => address1
					expect(decodedLog.args.owner.toLowerCase()).to.equal(
						address1.account?.address!.toLowerCase()
					);
				}
			} catch (error) {}
		}
	});

  it("should set new hats address", async () => {
    const oldHatsAddress = Hats.address;
    const newHatsAddress = address1.account?.address!;
    const ownerAccount = address1.account;

		expect((await BigBang.read.Hats()).toLowerCase()).to.equal(oldHatsAddress);

    await BigBang.write.setHats([newHatsAddress], {
      account: ownerAccount,
    });

		expect((await BigBang.read.Hats()).toLowerCase()).to.equal(newHatsAddress);

		// revert it
		await BigBang.write.setHats([oldHatsAddress], {
			account: ownerAccount,
		});

		expect((await BigBang.read.Hats()).toLowerCase()).to.equal(oldHatsAddress);
	});

  it("should set new hats module factory address", async () => {
    const oldHatsModuleFactoryAddress = HatsModuleFactory.address;
    const newHatsModuleFactoryAddress = address1.account?.address!;
    const ownerAccount = address1.account;

		expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).to.equal(
			oldHatsModuleFactoryAddress
		);

    await BigBang.write.setHatsModuleFactory([newHatsModuleFactoryAddress], {
      account: ownerAccount,
    });

		expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).to.equal(
			newHatsModuleFactoryAddress
		);

		// revert
		await BigBang.write.setHatsModuleFactory([oldHatsModuleFactoryAddress], {
			account: ownerAccount,
		});
		expect((await BigBang.read.HatsModuleFactory()).toLowerCase()).to.equal(
			oldHatsModuleFactoryAddress
		);
	});

  it("should set new splits creator factory address", async () => {
    const oldSplitsCreatorFactoryAddress = SplitsCreatorFactory.address;
    const newSplitsCreatorFactoryAddress = address1.account?.address!;
    const ownerAccount = address1.account;

		expect(await BigBang.read.SplitsCreatorFactory()).to.equal(
			oldSplitsCreatorFactoryAddress
		);

    await BigBang.write.setSplitsCreatorFactory(
      [newSplitsCreatorFactoryAddress],
      {
        account: ownerAccount,
      },
    );

		expect((await BigBang.read.SplitsCreatorFactory()).toLowerCase()).to.equal(
			newSplitsCreatorFactoryAddress
		);

		// revert
		await BigBang.write.setSplitsCreatorFactory(
			[oldSplitsCreatorFactoryAddress],
			{
				account: ownerAccount,
			}
		);

		expect(await BigBang.read.SplitsCreatorFactory()).to.equal(
			oldSplitsCreatorFactoryAddress
		);
	});

  it("should set new hats time frame module address", async () => {
    const oldHatsTimeFrameModuleAddress = HatsTimeFrameModule_IMPL.address;
    const newHatsTimeFrameModuleAddress = address1.account?.address!;
    const ownerAccount = address1.account;

		expect(
			(await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()
		).to.equal(oldHatsTimeFrameModuleAddress);

    await BigBang.write.setHatsTimeFrameModuleImpl(
      [newHatsTimeFrameModuleAddress],
      {
        account: ownerAccount,
      },
    );

		expect(
			(await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()
		).to.equal(newHatsTimeFrameModuleAddress);

		// revert
		await BigBang.write.setHatsTimeFrameModuleImpl(
			[oldHatsTimeFrameModuleAddress],
			{
				account: ownerAccount,
			}
		);

		expect(
			(await BigBang.read.HatsTimeFrameModule_IMPL()).toLowerCase()
		).to.equal(oldHatsTimeFrameModuleAddress);
	});

  it("should set new splits factory v2 address", async () => {
    const oldSplitsFactoryV2Address = PullSplitsFactory.address;
    const newSplitsFactoryV2Address = address1.account?.address!;
    const ownerAccount = address1.account;

		expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).to.equal(
			oldSplitsFactoryV2Address
		);

    await BigBang.write.setSplitsFactoryV2([newSplitsFactoryV2Address], {
      account: ownerAccount,
    });

		expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).to.equal(
			newSplitsFactoryV2Address
		);

		// revert
		await BigBang.write.setSplitsFactoryV2([oldSplitsFactoryV2Address], {
			account: ownerAccount,
		});
		expect((await BigBang.read.SplitsFactoryV2()).toLowerCase()).to.equal(
			oldSplitsFactoryV2Address
		);
	});

  it("should set new fraction token address", async () => {
    const oldFractionTokenAddress = FractionToken.address;
    const newFractionTokenAddress = address1.account?.address!;
    const ownerAccount = address1.account;

		expect(await BigBang.read.FractionToken()).to.equal(
			oldFractionTokenAddress
		);

    await BigBang.write.setFractionToken([newFractionTokenAddress], {
      account: ownerAccount,
    });

		expect((await BigBang.read.FractionToken()).toLowerCase()).to.equal(
			newFractionTokenAddress
		);

		// revert
		await BigBang.write.setFractionToken([oldFractionTokenAddress], {
			account: ownerAccount,
		});
		expect(await BigBang.read.FractionToken()).to.equal(
			oldFractionTokenAddress
		);
	});

	/**
	 * 以降は、Upgradeのテストコードになる。
	 * Upgrade後に再度機能をテストする。
	 */
	describe("Upgrade Test", () => {
		it("upgrade", async () => {
			// BigBangをアップグレード
			const newBigBang = await upgradeBigBang(
				BigBang.address,
				"BigBang_Mock_v2"
			);

      // upgrade後にしかないメソッドを実行
      const result = await newBigBang.read.testUpgradeFunction();
      expect(result).to.equal("testUpgradeFunction");
    });

    it("should execute bigbang after upgrade", async () => {
      // BigBangをアップグレード
      const newBigBang = await upgradeBigBang(
        BigBang.address,
        "BigBang_Mock_v2",
      );

      // SplitsCreatorFactoryにBigBangアドレスをセット
      SplitsCreatorFactory.write.setBigBang([newBigBang.address]);

			const txHash = await newBigBang.write.bigbang(
				[
					address1.account?.address!,
					"tophatDetails",
					"tophatURI",
					"hatterhatDetails",
					"hatterhatURI",
					alwaysTrueAddress,
					alwaysTrueAddress,
				],
				{ account: address1.account }
			);

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      for (const log of receipt.logs) {
        try {
          const decodedLog: any = decodeEventLog({
            abi: newBigBang.abi as any,
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
