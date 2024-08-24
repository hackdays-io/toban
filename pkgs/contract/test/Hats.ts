import {ethers} from "hardhat";
import {Hats} from "../typechain-types";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {ZeroAddress} from "ethers";
import {deployHatsProtocol} from "./helper/deploy";
import {expect} from "chai";

describe("Hats", () => {
  let Hats: Hats;

  let address1: SignerWithAddress;

  before(async () => {
    const {Hats: _Hats} = await deployHatsProtocol();
    Hats = _Hats;

    [address1] = await ethers.getSigners();
  });

  it("should mint top hat", async () => {
    // mintTopHatをethersjsから直接呼び出すとエラーがでる。
    // なのでトランザクションデータを生成して、sendTransactionで呼び出す。
    // そのためにtxDataを生成する。
    const txData = Hats.interface.encodeFunctionData("mintTopHat", [
      address1.address,
      "Description",
      "https://test.com/tophat.png",
    ]);

    const tx = await address1.sendTransaction({
      to: await Hats.getAddress(),
      data: txData,
    });

    await tx.wait();
  });

  it("should create new hat", async () => {
    // _adminには親HatのIdを入れる
    // _eligibilityと_toggleはZeroAddress以外
    let tx = await Hats.createHat(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
      "test",
      10,
      "0x0000000000000000000000000000000000004a75",
      "0x0000000000000000000000000000000000004a75",
      true,
      "https://test.com/hat_image.png"
    );

    let receipt = await tx.wait();
    let log = receipt?.logs.find(
      (l: any) => l.fragment?.name === "HatCreated"
    ) as any;
    const firstLevelHatId = log?.args[0] as `0x${string}`;

    // 階層のチェック TopHat => FirstLevel
    expect(await Hats.getHatLevel(firstLevelHatId)).equal(1);

    // FirstLevelHatの下に新しいHatを作成
    tx = await Hats.createHat(
      firstLevelHatId,
      "test",
      10,
      "0x0000000000000000000000000000000000004a75",
      "0x0000000000000000000000000000000000004a75",
      true,
      "https://test.com/hat_image.png"
    );

    receipt = await tx.wait();

    log = receipt?.logs.find(
      (l: any) => l.fragment?.name === "HatCreated"
    ) as any;
    const secondLevelHatId = log?.args[0] as `0x${string}`;

    // 階層のチェック TopHat => FirstLevel => SecondLevel
    expect(await Hats.getHatLevel(secondLevelHatId)).equal(2);
  });
});
