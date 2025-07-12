import { viem } from "hardhat";
import {
  Address,
  WalletClient,
  PublicClient,
  decodeEventLog,
  encodeAbiParameters,
} from "viem";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";
import {
  deployHatsFractionTokenModule,
  deployHatsModuleFactory,
  deployHatsProtocol,
  Hats,
  HatsFractionTokenModule,
  HatsModuleFactory,
} from "../helpers/deploy/Hats";
import { expect } from "chai";

describe("HatsFractionTokenModule", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let HatsModuleFactory: HatsModuleFactory;
  let HatsFractionTokenModule_IMPL: HatsFractionTokenModule;
  let HatsFractionTokenModule: HatsFractionTokenModule;

  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;

  let address1Validated: Address;
  let address2Validated: Address;
  let address3Validated: Address;

  let topHatId: bigint;
  let hatterHatId: bigint;
  let hatId1: bigint;
  let hatId2: bigint;

  let publicClient: PublicClient;

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) {
      throw new Error("Wallet client account address is undefined");
    }
    return client.account.address;
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
      "https://example.com/top-hat",
    ]);

    topHatId = BigInt(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
    );

    const { HatsFractionTokenModule: _HatsFractionTokenModule_IMPL } =
      await deployHatsFractionTokenModule(
        address1Validated,
        "0.0.0",
        Create2Deployer.address,
      );
    HatsFractionTokenModule_IMPL = _HatsFractionTokenModule_IMPL;

    publicClient = await viem.getPublicClient();
  });

  describe("deploy fraction token module", () => {
    it("should deploy fraction token module", async () => {
      // オーナーアドレス、トークンURI、トークン供給量をエンコード
      const initData = encodeAbiParameters(
        [{ type: "address" }, { type: "string" }, { type: "uint256" }],
        [address1Validated, "https://example.com/fraction-token", 10000n],
      );

      // アシストクレジットのモジュールをデプロイ
      await HatsModuleFactory.write.createHatsModule([
        HatsFractionTokenModule_IMPL.address,
        topHatId,
        "0x",
        initData,
        BigInt(0),
      ]);

      const moduleAddress = await HatsModuleFactory.read.getHatsModuleAddress([
        HatsFractionTokenModule_IMPL.address,
        topHatId,
        "0x",
        BigInt(0),
      ]);

      HatsFractionTokenModule = await viem.getContractAt(
        "HatsFractionTokenModule",
        moduleAddress as Address,
      );

      expect(
        (await HatsFractionTokenModule.read.IMPLEMENTATION()).toLowerCase(),
      ).equal(HatsFractionTokenModule_IMPL.address.toLowerCase());

      // Hatter Hatを作成
      let txHash = await Hats.write.createHat([
        topHatId,
        "",
        100,
        "0x0000000000000000000000000000000000004a75",
        "0x0000000000000000000000000000000000004a75",
        true,
        "",
      ]);
      let receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      let _hatterHatId;
      for (const log of receipt.logs) {
        const decodedLog = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "HatCreated") {
          _hatterHatId = decodedLog.args.id;
        }
      }

      if (!_hatterHatId) {
        throw new Error("Hatter hat ID not found in transaction logs");
      } else {
        hatterHatId = _hatterHatId;
      }

      // Hatter Hatをアシストクレジットのモジュールにミント
      await Hats.write.mintHat([hatterHatId, HatsFractionTokenModule.address], {
        account: address1Validated,
      });

      // Hatの作成
      await Hats.write.createHat([
        hatterHatId,
        "",
        100,
        "0x0000000000000000000000000000000000004a75",
        "0x0000000000000000000000000000000000004a75",
        true,
        "",
      ]);
      await Hats.write.createHat([
        hatterHatId,
        "",
        100,
        "0x0000000000000000000000000000000000004a75",
        "0x0000000000000000000000000000000000004a75",
        true,
        "",
      ]);

      hatId1 = BigInt(
        "0x0000000100010001000000000000000000000000000000000000000000000000",
      );
      hatId2 = BigInt(
        "0x0000000100010002000000000000000000000000000000000000000000000000",
      );

      // hat1 => address2
      // hat2 => address2, address3
      await Hats.write.batchMintHats(
        [
          [hatId1, hatId2, hatId2],
          [address2Validated, address2Validated, address3Validated],
        ],
        {
          account: address1Validated,
        },
      );
    });

    it("should have valid owner, token URI, domain, and token supply", async () => {
      // オーナーアドレスはエンコードした初期データと一致
      expect(
        (await HatsFractionTokenModule.read.owner()).toLowerCase(),
      ).to.equal(address1Validated.toLowerCase());

      // トークンURIはエンコードした初期データと一致
      expect(await HatsFractionTokenModule.read.uri([0n])).to.equal(
        "https://example.com/fraction-token",
      );

      // ワークスペースIDは1
      expect(await HatsFractionTokenModule.read.getDomain()).to.equal(1);

      // トークン供給量はエンコードした初期データと一致
      expect(
        await HatsFractionTokenModule.read.DEFAULT_TOKEN_SUPPLY(),
      ).to.equal(10000n);
    });

    it("should mint tokens correctly", async () => {
      // address2にhat1に紐づくトークンを量未指定(0)で自身でミント
      await HatsFractionTokenModule.write.mintInitialSupply(
        [hatId1, address2Validated, 0n],
        {
          account: address2Validated,
        },
      );

      // address2のトークン残高は初期化データで渡した供給量と一致
      let tokenId = await HatsFractionTokenModule.read.getTokenId([
        hatId1,
        address2Validated,
      ]);
      let balanceAddress2 = await HatsFractionTokenModule.read.balanceOf([
        address2Validated,
        tokenId,
      ]);
      expect(balanceAddress2).to.equal(10000n);

      // 再度mintInitialSupply関数は呼べない
      await HatsFractionTokenModule.write
        .mintInitialSupply([hatId1, address2Validated, 0n])
        .catch((error) => {
          expect(error).to.be.instanceOf(Error);
          expect(error.message).to.include("TokenAlreadyMinted()");
        });

      // address2にhat1に紐づくトークンを量指定でaddress1(hatのadmin)が追加ミント
      await HatsFractionTokenModule.write.mint(
        [hatId1, address2Validated, 5000n],
        {
          account: address1Validated,
        },
      );

      // address2のトークン残高を確認
      tokenId = await HatsFractionTokenModule.read.getTokenId([
        hatId1,
        address2Validated,
      ]);
      balanceAddress2 = await HatsFractionTokenModule.read.balanceOf([
        address2Validated,
        tokenId,
      ]);
      expect(balanceAddress2).to.equal(15000n);

      // AdminやWearerでないaddress3はaddress2にhat1のトークンをミントできない
      await HatsFractionTokenModule.write
        .mint([hatId1, address2Validated, 0n], {
          account: address3Validated,
        })
        .catch((error) => {
          expect(error).to.be.instanceOf(Error);
          expect(error.message).to.include("CallerNotHatAdminOrWearer()");
        });

      // hat1のWearerでないaddress3はhat1に紐づくトークンをミントできない
      HatsFractionTokenModule.write
        .mintInitialSupply([hatId1, address3Validated, 0n], {
          account: address1Validated,
        })
        .catch((error) => {
          expect(error).to.be.instanceOf(Error);
          expect(error.message).to.include("WearerDoesNothavehat()");
        });
    });

    it("should transfer tokens correctly", async () => {
      // address2からaddress3へhat1に紐づくトークンを転送
      let tokenId = await HatsFractionTokenModule.read.getTokenId([
        hatId1,
        address2Validated,
      ]);
      await HatsFractionTokenModule.write.safeTransferFrom(
        [address2Validated, address3Validated, tokenId, 5000n, "0x"],
        {
          account: address2Validated,
        },
      );

      // address2のトークン残高を確認
      let balanceAddress2 = await HatsFractionTokenModule.read.balanceOf([
        address2Validated,
        tokenId,
      ]);
      expect(balanceAddress2).to.equal(10000n);

      // address3のトークン残高を確認
      let balanceAddress3 = await HatsFractionTokenModule.read.balanceOf([
        address3Validated,
        tokenId,
      ]);
      expect(balanceAddress3).to.equal(5000n);

      // address2のトークン全てはaddress3に転送できない
      await HatsFractionTokenModule.write
        .safeTransferFrom(
          [address2Validated, address3Validated, tokenId, 10000n, "0x"],
          {
            account: address2Validated,
          },
        )
        .catch((error) => {
          expect(error).to.be.instanceOf(Error);
          expect(error.message).to.include("CannotTransferAllTokens()");
        });
    });

    it("should burn tokens correctly", async () => {
      // 上位Hatの権限を持つaddress1がaddress2のhat1に紐づくトークンをburn
      await HatsFractionTokenModule.write.burn(
        [hatId1, address2Validated, address2Validated, 5000n],
        {
          account: address1Validated,
        },
      );

      // address2のhat1に紐づくトークン残高を確認
      let tokenId = await HatsFractionTokenModule.read.getTokenId([
        hatId1,
        address2Validated,
      ]);
      let balanceAddress2 = await HatsFractionTokenModule.read.balanceOf([
        address2Validated,
        tokenId,
      ]);
      expect(balanceAddress2).to.equal(5000n);

      // address2がaddress3に送っていたhat1に紐づくトークンをburn
      await HatsFractionTokenModule.write.burn(
        [hatId1, address2Validated, address3Validated, 5000n],
        {
          account: address2Validated,
        },
      );

      // address3が保有しているaddress2のhat1に紐づくトークン残高を確認
      let balanceAddress3 = await HatsFractionTokenModule.read.balanceOf([
        address3Validated,
        tokenId,
      ]);
      expect(balanceAddress3).to.equal(0n);
    });
  });
});
