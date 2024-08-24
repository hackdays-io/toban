import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {BigNumberish, keccak256, parseEther, ZeroAddress} from "ethers";
import {
  FractionToken,
  Hats,
  PullSplit,
  PullSplitFactory,
  PushSplitFactory,
  SplitCreator,
  SplitsWarehouse,
} from "../typechain-types";
import {
  deployFractionToken,
  deployHatsProtocol,
  deploySplitCreator,
  deploySplitsProtocol,
} from "./helper/deploy";
import {expect} from "chai";

describe("Splits", () => {
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitFactory;
  let PushSplitsFactory: PushSplitFactory;
  let DeployedPullSplit: PullSplit;

  let address1: SignerWithAddress;
  let address2: SignerWithAddress;

  before(async () => {
    const {
      SplitsWarehouse: _SplitsWarehouse,
      PullSplitsFactory: _PullSplitsFactory,
      PushSplitsFactory: _PushSplitsFactory,
    } = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

    [address1, address2] = await ethers.getSigners();
  });

  it("should create PullSplits contract", async () => {
    // address1とaddress2に50%ずつ配分するSplitを作成
    const split = await PullSplitsFactory.createSplit(
      {
        recipients: [address1.address, address2.address],
        allocations: [50, 50],
        totalAllocation: 100,
        distributionIncentive: 0,
      },
      address1.address,
      address1.address
    );

    const splitResult = await split.wait();

    const splitAddress = (
      splitResult?.logs.find(
        (l: any) => l.fragment?.name === "SplitCreated"
      ) as any
    ).args[0];

    DeployedPullSplit = await ethers.getContractAt("PullSplit", splitAddress);
  });

  it("Should destribute", async () => {
    expect(
      await ethers.provider.getBalance(await DeployedPullSplit.getAddress())
    ).equal(0);

    // Splitコントラクトに1ETH送金
    await address1.sendTransaction({
      to: await DeployedPullSplit.getAddress(),
      value: parseEther("1"),
    });

    const beforeAddress2Balance = await ethers.provider.getBalance(
      address2.address
    );

    // Distributeを実行
    // Nativeトークンのアドレスが0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeEらしい
    let tx = await DeployedPullSplit[
      "distribute((address[],uint256[],uint256,uint16),address,address)"
    ](
      {
        recipients: [address1.address, address2.address],
        allocations: [50, 50],
        totalAllocation: 100,
        distributionIncentive: 0,
      },
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      address1.address
    );

    await tx.wait();

    // withdrawを実行
    await SplitsWarehouse.connect(address2)["withdraw(address,address)"](
      address2.address,
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    );

    const afterAddress2Balance = await ethers.provider.getBalance(
      address2.address
    );

    // withdrawのガス代を引いて大体0.5ETH増えているはず
    expect(Number(afterAddress2Balance) - Number(beforeAddress2Balance)).gt(
      499900000000000000
    );
  });
});

describe("CreateSplit", () => {
  let Hats: Hats;
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitFactory;
  let PushSplitsFactory: PushSplitFactory;
  let SplitCreator: SplitCreator;
  let FractionToken: FractionToken;

  let address1: SignerWithAddress;
  let address2: SignerWithAddress;
  let address3: SignerWithAddress;

  let hat1_id: BigNumberish;
  let hat2_id: BigNumberish;

  before(async () => {
    const {Hats: _Hats} = await deployHatsProtocol();
    Hats = _Hats;

    const {
      SplitsWarehouse: _SplitsWarehouse,
      PullSplitsFactory: _PullSplitsFactory,
      PushSplitsFactory: _PushSplitsFactory,
    } = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

    const {FractionToken: _FractionToken} = await deployFractionToken(
      "",
      await Hats.getAddress(),
      ZeroAddress
    );
    FractionToken = _FractionToken;

    const {SplitCreator: _SplitCreator} = await deploySplitCreator(
      await PullSplitsFactory.getAddress(),
      await FractionToken.getAddress(),
      ZeroAddress
    );
    SplitCreator = _SplitCreator;

    [address1, address2, address3] = await ethers.getSigners();

    const mintTopHatData = Hats.interface.encodeFunctionData("mintTopHat", [
      address1.address,
      "Description",
      "https://test.com/tophat.png",
    ]);

    const mintTopHatTX = await address1.sendTransaction({
      to: await Hats.getAddress(),
      data: mintTopHatData,
    });

    await mintTopHatTX.wait();

    let tx = await Hats.createHat(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
      "role1",
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
    hat1_id = BigInt(log?.args[0]);

    tx = await Hats.createHat(
      "0x0000000100000000000000000000000000000000000000000000000000000000",
      "role2",
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
    hat2_id = BigInt(log?.args[0]);

    // address1とaddress2にHatをmint
    await Hats.mintHat(hat1_id, address1.address);
    await Hats.mintHat(hat2_id, address2.address);

    // address1とaddress2にFractionTokenをmint
    await expect(FractionToken.mint(hat1_id.toString(), address1.address)).emit(
      FractionToken,
      "TransferSingle"
    );
    await expect(FractionToken.mint(hat2_id.toString(), address2.address)).emit(
      FractionToken,
      "TransferSingle"
    );

    const tokenId = await FractionToken.getTokenId(hat2_id, address2.address);

    tx = await FractionToken.connect(address2).safeTransferFrom(
      address2.address,
      address3.address,
      tokenId,
      5000,
      "0x"
    );
    await tx.wait();
  });

  it("should create a split", async () => {
    const tx = await SplitCreator.create([
      {
        hatId: hat2_id,
        wearers: [address2.address],
        multiplierBottom: 1,
        multiplierTop: 1,
      },
      {
        hatId: hat1_id,
        wearers: [address1.address],
        multiplierBottom: 1,
        multiplierTop: 1,
      },
    ]);

    const receipt = await tx.wait();

    const splitAddress = (
      receipt?.logs.find((l: any) => l.fragment?.name === "SplitCreated") as any
    ).args[0];

    await address1.sendTransaction({
      to: splitAddress,
      value: parseEther("1000"),
    });

    const beforeAddress1Balance = await ethers.provider.getBalance(
      address1.address
    );
    const beforeAddress2Balance = await ethers.provider.getBalance(
      address2.address
    );
    const beforeAddress3Balance = await ethers.provider.getBalance(
      address3.address
    );

    const Split = await ethers.getContractAt("PullSplit", splitAddress);
    await Split[
      "distribute((address[],uint256[],uint256,uint16),address,address)"
    ](
      {
        recipients: [address2.address, address3.address, address1.address],
        allocations: [5000, 5000, 10000],
        totalAllocation: 20000,
        distributionIncentive: 0,
      },
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      address1.address
    );

    // withdrawを実行
    await SplitsWarehouse.connect(address1)["withdraw(address,address)"](
      address1.address,
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    );
    await SplitsWarehouse.connect(address2)["withdraw(address,address)"](
      address2.address,
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    );
    await SplitsWarehouse.connect(address3)["withdraw(address,address)"](
      address3.address,
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    );

    const afterAddress1Balance = await ethers.provider.getBalance(
      address1.address
    );
    const afterAddress2Balance = await ethers.provider.getBalance(
      address2.address
    );
    const afterAddress3Balance = await ethers.provider.getBalance(
      address3.address
    );

    console.log("address1", beforeAddress1Balance, afterAddress1Balance);
    console.log("address2", beforeAddress2Balance, afterAddress2Balance);
    console.log("address3", beforeAddress3Balance, afterAddress3Balance);
  });
});
