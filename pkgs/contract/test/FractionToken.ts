import { expect } from "chai";
import { viem } from "hardhat";
import type { Address, PublicClient, WalletClient } from "viem";
import { decodeEventLog, encodeFunctionData, zeroAddress } from "viem";

interface ContractError extends Error {
  message: string;
}
import {
  type FractionToken,
  deployFractionToken,
} from "../helpers/deploy/FractionToken";
import { type Hats, deployHatsProtocol } from "../helpers/deploy/Hats";
import { upgradeFractionToken } from "../helpers/upgrade/fractionToken";
import {
  Create2Deployer,
  deployCreate2Deployer,
} from "../helpers/deploy/Create2Factory";

describe("FractionToken", () => {
  let Create2Deployer: Create2Deployer;
  let Hats: Hats;
  let FractionToken: FractionToken;

  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let address4: WalletClient;
  let address5: WalletClient;
  let address1Validated: Address;
  let address2Validated: Address;
  let address3Validated: Address;
  let address4Validated: Address;
  let address5Validated: Address;

  let hatId: bigint;

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

    // Hatsコントラクトをデプロイする。
    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    // FractionTokenをデプロイする。
    const { FractionToken: _FractionToken } = await deployFractionToken(
      "",
      10000n,
      Hats.address,
      Create2Deployer.address,
    );
    FractionToken = _FractionToken;

    [address1, address2, address3, address4, address5] =
      await viem.getWalletClients();

    address1Validated = validateAddress(address1);
    address2Validated = validateAddress(address2);
    address3Validated = validateAddress(address3);
    address4Validated = validateAddress(address4);
    address5Validated = validateAddress(address5);

    publicClient = await viem.getPublicClient();

    const tx1 = await Hats.write.mintTopHat([
      address1Validated,
      "Description",
      "https://test.com/tophat.png",
    ]);

    await publicClient.waitForTransactionReceipt({
      hash: tx1,
    });

    const tx2 = await Hats.write.createHat([
      BigInt(
        "0x0000000100000000000000000000000000000000000000000000000000000000",
      ),
      "role1",
      10,
      "0x0000000000000000000000000000000000004a75",
      "0x0000000000000000000000000000000000004a75",
      true,
      "https://test.com/hat_image.png",
    ]);

    const receipt2 = await publicClient.waitForTransactionReceipt({
      hash: tx2,
    });

    for (const log of receipt2.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: Hats.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "HatCreated") hatId = decodedLog.args.id;
      } catch (error) {}
    }

    // address2,address3, address5にHatをmint
    await Hats.write.mintHat([hatId, address2Validated]);
    await Hats.write.mintHat([hatId, address3Validated]);
    await Hats.write.mintHat([hatId, address5Validated]);
  });

  it("should mint, transfer and burn tokens", async () => {
    // address1がaddress2,address3にtokenをmint
    await FractionToken.write.mintInitialSupply(
      [hatId, address2Validated, 0n],
      { account: address1.account },
    );
    await FractionToken.write.mintInitialSupply(
      [hatId, address3Validated, 0n],
      { account: address1.account },
    );

    // transfer と burn前の残高情報を取得する
    let balance: bigint;

    // 処理前のaddress2のbalance
    balance = await FractionToken.read.balanceOf([
      address2Validated,
      address2Validated,
      hatId,
    ]);
    expect(balance).to.equal(10000n);

    // 処理前のaddress3のbalance
    balance = await FractionToken.read.balanceOf([
      address3Validated,
      address3Validated,
      hatId,
    ]);
    expect(balance).to.equal(10000n);

    // 処理前のaddress4のbalance
    balance = await FractionToken.read.balanceOf([
      address4Validated,
      address2Validated,
      hatId,
    ]);
    expect(balance).to.equal(0n);

    // address3が自分自身にtokenを追加でmint
    await FractionToken.write.mint([hatId, address3Validated, 5000n], {
      account: address3.account,
    });

    const tokenId = await FractionToken.read.getTokenId([
      hatId,
      address2Validated,
    ]);

    // address2のtokenの半分をaddress4に移動
    await FractionToken.write.safeTransferFrom(
      [address2Validated, address4Validated, tokenId, 5000n, "0x"],
      { account: address2.account },
    );

    // address2のtokenをaddress1が半分burnする
    await FractionToken.write.burn(
      [address2Validated, address2Validated, hatId, 2500n],
      { account: address1.account },
    );

    // 処理後のaddress2のbalance
    balance = await FractionToken.read.balanceOf([
      address2Validated,
      address2Validated,
      hatId,
    ]);
    expect(balance).to.equal(2500n);

    // 処理後のaddress3のbalance
    balance = await FractionToken.read.balanceOf([
      address3Validated,
      address3Validated,
      hatId,
    ]);
    expect(balance).to.equal(15000n);

    // 処理後のaddress4のbalance
    balance = await FractionToken.read.balanceOf([
      address4Validated,
      address2Validated,
      hatId,
    ]);
    expect(balance).to.equal(5000n);
  });

  it("should fail to mint a token", async () => {
    // roleのない人にtokenはmintできない
    await FractionToken.write
      .mintInitialSupply([hatId, address4Validated, 0n], {
        account: address1.account,
      })
      .catch((error: ContractError) => {
        expect(error.message).to.include("This account does not have the role");
      });

    // 権限のない人はtokenをmintできない
    await FractionToken.write
      .mintInitialSupply([hatId, address2Validated, 0n], {
        account: address3.account,
      })
      .catch((error: ContractError) => {
        expect(error.message).to.include(
          "This msg.sender does not have the authority",
        );
      });

    // tokenは二度mintできない
    await FractionToken.write
      .mintInitialSupply([hatId, address2Validated, 0n])
      .catch((error: ContractError) => {
        expect(error.message).to.include("This account has already received");
      });

    // initial supplyを受けていない場合は追加のmintはできない
    await FractionToken.write
      .mint([hatId, address4Validated, 5000n], {
        account: address4.account,
      })
      .catch((error: ContractError) => {
        expect(error.message).to.include(
          "This account has not received the initial supply",
        );
      });

    // tokenの最初の受け取り手以外は追加でmintできない
    await FractionToken.write
      .mint([hatId, address2Validated, 5000n], {
        account: address4.account,
      })
      .catch((error: ContractError) => {
        expect(error.message).to.include(
          "Only the first recipient can additionally mint",
        );
      });
  });

  it("should fail to burn a token", async () => {
    // address2のtokenはaddress3によってburnできない
    await FractionToken.write
      .burn([address2Validated, address2Validated, hatId, 5000n], {
        account: address3.account,
      })
      .catch((error: ContractError) => {
        expect(error.message).to.include("Not authorized");
      });
  });

  it("should success initial supply and transfer with multicall", async () => {
    const tokenId = BigInt(
      await FractionToken.read.getTokenId([hatId, address5Validated]),
    );
    const mintInitialSupplyCalldata = encodeFunctionData({
      abi: FractionToken.abi,
      functionName: "mintInitialSupply",
      args: [hatId, address5Validated, 0n],
    });
    const transferCalldata = encodeFunctionData({
      abi: FractionToken.abi,
      functionName: "safeTransferFrom",
      args: [address5Validated, address1Validated, tokenId, 1000n, "0x"],
    });

    await FractionToken.write.multicall(
      [[mintInitialSupplyCalldata, transferCalldata]],
      {
        account: address5.account,
      },
    );
  });

  /**
   * 以降は、Upgradeのテストコードになる。
   * Upgrade後に再度機能をテストする。
   */
  describe("Upgrade Test", () => {
    it("upgrade", async () => {
      // FractionTokenをアップグレード
      const { UpgradedFractionToken: newFractionToken } =
        await upgradeFractionToken(
          FractionToken.address,
          "FractionToken_Mock_v2",
          Create2Deployer.address,
        );

      // upgrade後にしかないメソッドを実行
      const result = await newFractionToken.read.testUpgradeFunction();
      expect(result).to.equal("testUpgradeFunction");
    });

    it("should mint, transfer and burn tokens after upgrade", async () => {
      // FractionTokenをアップグレード
      const { UpgradedFractionToken: newFractionToken } =
        await upgradeFractionToken(
          FractionToken.address,
          "FractionToken_Mock_v2",
          Create2Deployer.address,
        );

      // get token id
      const tokenId = await newFractionToken.read.getTokenId([
        hatId,
        address2Validated,
      ]);

      // 現時点 address2: 2500n, address3: 15000n, address4: 5000n

      // address2のtokenの半分をaddress4に移動
      await FractionToken.write.safeTransferFrom(
        [address2Validated, address4Validated, tokenId, 1250n, "0x"],
        { account: address2.account },
      );

      // address2のtokenをaddress1によって半分burnする
      await newFractionToken.write.burn(
        [address2Validated, address2Validated, hatId, 625n],
        { account: address1.account },
      );

      // address2のbalance
      const balance2 = BigInt(
        await newFractionToken.read.balanceOf([
          address2Validated,
          address2Validated,
          hatId,
        ]),
      );
      expect(balance2).to.equal(625n);

      // address3のbalance
      const balance3 = BigInt(
        await newFractionToken.read.balanceOf([
          address3Validated,
          address3Validated,
          hatId,
        ]),
      );
      expect(balance3).to.equal(15000n);

      // address4のbalance
      const balance4 = BigInt(
        await newFractionToken.read.balanceOf([
          address4Validated,
          address2Validated,
          hatId,
        ]),
      );
      expect(balance4).to.equal(6250n);
    });

    it("should fail to mint a token after upgrade", async () => {
      // FractionTokenをアップグレード
      const { UpgradedFractionToken: newFractionToken } =
        await upgradeFractionToken(
          FractionToken.address,
          "FractionToken_Mock_v2",
          Create2Deployer.address,
        );

      // 権限のない人にtokenはmintできない
      await newFractionToken.write
        .mintInitialSupply([hatId, address4Validated, 0n], {
          account: address1.account,
        })
        .catch((error: any) => {
          expect(error.message).to.include(
            "This account does not have the role",
          );
        });

      // tokenは二度mintできない
      await newFractionToken.write
        .mintInitialSupply([hatId, address2Validated, 0n], {
          account: address1.account,
        })
        .catch((error: any) => {
          expect(error.message).to.include("This account has already received");
        });
    });
  });
});
