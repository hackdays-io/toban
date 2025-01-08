import { expect } from "chai";
import { viem } from "hardhat";
import {
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  encodeFunctionData,
  zeroAddress,
} from "viem";
import {
  type FractionToken,
  deployFractionToken,
} from "../helpers/deploy/FractionToken";
import { type Hats, deployHatsProtocol } from "../helpers/deploy/Hats";
import { upgradeFractionToken } from "../helpers/upgrade/fractionToken";

describe("FractionToken", () => {
  let Hats: Hats;
  let FractionToken: FractionToken;

  let address1: WalletClient;
  let address2: WalletClient;
  let address3: WalletClient;
  let address4: WalletClient;
  let address5: WalletClient;

  let hatId: bigint;

  let publicClient: PublicClient;

  before(async () => {
    // Hatsコントラクトをデプロイする。
    const { Hats: _Hats } = await deployHatsProtocol();
    Hats = _Hats;

    // FractionTokenをデプロイする。
    const { FractionToken: _FractionToken } = await deployFractionToken(
      "",
      10000n,
      Hats.address,
    );
    FractionToken = _FractionToken;

    [address1, address2, address3, address4, address5] =
      await viem.getWalletClients();

    publicClient = await viem.getPublicClient();

    const tx1 = await Hats.write.mintTopHat([
      address1.account?.address!,
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
    await Hats.write.mintHat([hatId, address2.account?.address!]);
    await Hats.write.mintHat([hatId, address3.account?.address!]);
    await Hats.write.mintHat([hatId, address5.account?.address!]);
  });

  it("should mint, transfer and burn tokens", async () => {
    // address1がaddress2,address3にtokenをmint
    await FractionToken.write.mintInitialSupply(
      [hatId, address2.account?.address!, 0n],
      { account: address1.account! },
    );
    await FractionToken.write.mintInitialSupply(
      [hatId, address3.account?.address!, 0n],
      { account: address1.account! },
    );

    // transfer と burn前の残高情報を取得する
    let balance: bigint;

    // 処理前のaddress2のbalance
    balance = await FractionToken.read.balanceOf([
      address2.account?.address!,
      address2.account?.address!,
      hatId,
    ]);
    expect(balance).to.equal(10000n);

    // 処理前のaddress3のbalance
    balance = await FractionToken.read.balanceOf([
      address3.account?.address!,
      address3.account?.address!,
      hatId,
    ]);
    expect(balance).to.equal(10000n);

    // 処理前のaddress4のbalance
    balance = await FractionToken.read.balanceOf([
      address4.account?.address!,
      address2.account?.address!,
      hatId,
    ]);
    expect(balance).to.equal(0n);

    // address3が自分自身にtokenを追加でmint
    await FractionToken.write.mint([hatId, address3.account?.address!, 5000n], {
      account: address3.account!,
    });

    const tokenId = await FractionToken.read.getTokenId([
      hatId,
      address2.account?.address!,
    ]);

    // address2のtokenの半分をaddress4に移動
    await FractionToken.write.safeTransferFrom(
      [
        address2.account?.address!,
        address4.account?.address!,
        tokenId,
        5000n,
        "0x",
      ],
      { account: address2.account! },
    );

    // address2のtokenをaddress1が半分burnする
    await FractionToken.write.burn(
      [address2.account?.address!, address2.account?.address!, hatId, 2500n],
      { account: address1.account! },
    );

    // 処理後のaddress2のbalance
    balance = await FractionToken.read.balanceOf([
      address2.account?.address!,
      address2.account?.address!,
      hatId,
    ]);
    expect(balance).to.equal(2500n);

    // 処理後のaddress3のbalance
    balance = await FractionToken.read.balanceOf([
      address3.account?.address!,
      address3.account?.address!,
      hatId,
    ]);
    expect(balance).to.equal(15000n);

    // 処理後のaddress4のbalance
    balance = await FractionToken.read.balanceOf([
      address4.account?.address!,
      address2.account?.address!,
      hatId,
    ]);
    expect(balance).to.equal(5000n);
  });

  it("should fail to mint a token", async () => {
    // roleのない人にtokenはmintできない
    await FractionToken.write
      .mintInitialSupply([hatId, address4.account?.address!, 0n], {
        account: address1.account!,
      })
      .catch((error: any) => {
        expect(error.message).to.include("This account does not have the role");
      });

    // 権限のない人はtokenをmintできない
    await FractionToken.write
      .mintInitialSupply([hatId, address2.account?.address!, 0n], {
        account: address3.account!,
      })
      .catch((error: any) => {
        expect(error.message).to.include(
          "This msg.sender does not have the authority",
        );
      });

    // tokenは二度mintできない
    await FractionToken.write
      .mintInitialSupply([hatId, address2.account?.address!, 0n])
      .catch((error: any) => {
        expect(error.message).to.include("This account has already received");
      });

    // initial supplyを受けていない場合は追加のmintはできない
    await FractionToken.write
      .mint([hatId, address4.account?.address!, 5000n], {
        account: address4.account!,
      })
      .catch((error: any) => {
        expect(error.message).to.include(
          "This account has not received the initial supply",
        );
      });

    // tokenの最初の受け取り手以外は追加でmintできない
    await FractionToken.write
      .mint([hatId, address2.account?.address!, 5000n], {
        account: address4.account!,
      })
      .catch((error: any) => {
        expect(error.message).to.include(
          "Only the first recipient can additionally mint",
        );
      });
  });

  it("should fail to burn a token", async () => {
    // address2のtokenはaddress3によってburnできない
    await FractionToken.write
      .burn(
        [address2.account?.address!, address2.account?.address!, hatId, 5000n],
        { account: address3.account! },
      )
      .catch((error: any) => {
        expect(error.message).to.include("Not authorized");
      });
  });

  it("should success initial supply and transfer with multicall", async () => {
    const tokenId = await FractionToken.read.getTokenId([
      hatId,
      address5.account?.address!,
    ]);
    const mintInitialSupplyCalldata = encodeFunctionData({
      abi: FractionToken.abi,
      functionName: "mintInitialSupply",
      args: [hatId, address5.account?.address!, 0n],
    });
    const transferCalldata = encodeFunctionData({
      abi: FractionToken.abi,
      functionName: "safeTransferFrom",
      args: [
        address5.account?.address!,
        address1.account?.address!,
        tokenId,
        1000n,
        "0x",
      ],
    });

    await FractionToken.write.multicall(
      [[mintInitialSupplyCalldata, transferCalldata]],
      {
        account: address5.account!,
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
      const newFractionToken = await upgradeFractionToken(
        FractionToken.address,
        "FractionToken_Mock_v2",
        ["", 10000n, Hats.address, zeroAddress],
      );

      // upgrade後にしかないメソッドを実行
      const result = await newFractionToken.read.testUpgradeFunction();
      expect(result).to.equal("testUpgradeFunction");
    });

    it("should mint, transfer and burn tokens after upgrade", async () => {
      // FractionTokenをアップグレード
      const newFractionToken = await upgradeFractionToken(
        FractionToken.address,
        "FractionToken_Mock_v2",
        ["", 10000n, Hats.address, zeroAddress],
      );

      // get token id
      const tokenId = await newFractionToken.read.getTokenId([
        hatId,
        address2.account?.address!,
      ]);

      // 現時点 address2: 2500n, address3: 15000n, address4: 5000n

      // address2のtokenの半分をaddress4に移動
      await FractionToken.write.safeTransferFrom(
        [
          address2.account?.address!,
          address4.account?.address!,
          tokenId as bigint,
          1250n,
          "0x",
        ],
        { account: address2.account! },
      );

      // address2のtokenをaddress1によって半分burnする
      await newFractionToken.write.burn(
        [address2.account?.address!, address2.account?.address!, hatId, 625n],
        { account: address1.account! },
      );

      let balance;

      // address2のbalance
      balance = await newFractionToken.read.balanceOf([
        address2.account?.address!,
        address2.account?.address!,
        hatId,
      ]);
      expect(balance as bigint).to.equal(625n);

      // address3のbalance
      balance = await newFractionToken.read.balanceOf([
        address3.account?.address!,
        address3.account?.address!,
        hatId,
      ]);
      expect(balance as bigint).to.equal(15000n);

      // address4のbalance
      balance = await newFractionToken.read.balanceOf([
        address4.account?.address!,
        address2.account?.address!,
        hatId,
      ]);

      expect(balance as bigint).to.equal(6250n);
    });

    it("should fail to mint a token after upgrade", async () => {
      // FractionTokenをアップグレード
      const newFractionToken = await upgradeFractionToken(
        FractionToken.address,
        "FractionToken_Mock_v2",
        ["", 10000n, Hats.address, zeroAddress],
      );

      // 権限のない人にtokenはmintできない
      await newFractionToken.write
        .mintInitialSupply([hatId, address4.account?.address!], {
          account: address1.account!,
        })
        .catch((error: any) => {
          expect(error.message).to.include(
            "This account does not have the role",
          );
        });

      // tokenは二度mintできない
      await newFractionToken.write
        .mintInitialSupply([hatId, address2.account?.address!], {
          account: address1.account!,
        })
        .catch((error: any) => {
          expect(error.message).to.include("This account has already received");
        });
    });
  });
});
