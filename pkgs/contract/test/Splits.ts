import {ethers} from "hardhat";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {parseEther} from "ethers";
import {
  PullSplit,
  PullSplitFactory,
  PushSplitFactory,
  SplitsWarehouse,
} from "../typechain-types";
import {deploySplitsProtocol} from "./helper/deploy";
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
