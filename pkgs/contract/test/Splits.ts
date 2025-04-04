import { expect } from "chai";
import { viem } from "hardhat";
import {
  type Address,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  parseEther,
} from "viem";
import {
  type PullSplitsFactory,
  type PushSplitsFactory,
  type SplitsWarehouse,
  deploySplitsProtocol,
} from "../helpers/deploy/Splits";

describe("Splits", () => {
  let SplitsWarehouse: SplitsWarehouse;
  let PullSplitsFactory: PullSplitsFactory;
  let PushSplitsFactory: PushSplitsFactory;
  let DeployedPullSplit: Awaited<ReturnType<typeof getPullSplitContract>>;
  let address1: WalletClient;
  let address2: WalletClient;
  let address1Validated: Address;
  let address2Validated: Address;
  let publicClient: PublicClient;

  // Push型： 送金者がすぐに受取人に送金(手数料も送金者負担)
  // Pull型： 一度まとめて送金し、各受取人があとで「自分で取り出す」(宅急便の着払い、送料は受取人負担)

  // 試合終了後にユーザが資金を引き出すフローに使えそう

  const getPullSplitContract = async (address: Address) => {
    return await viem.getContractAt("PullSplit", address);
  };

  const validateAddress = (client: WalletClient): Address => {
    if (!client.account?.address) {
      throw new Error("Wallet client account address is undefined");
    }
    return client.account.address;
  };

  before(async () => {

    // 準備
    // deploySplitsProtocol() を使って必要なコントラクトをデプロイ
    const {
      SplitsWarehouse: _SplitsWarehouse,
      PullSplitsFactory: _PullSplitsFactory,
      PushSplitsFactory: _PushSplitsFactory,
    } = await deploySplitsProtocol();

    SplitsWarehouse = _SplitsWarehouse;
    PullSplitsFactory = _PullSplitsFactory;
    PushSplitsFactory = _PushSplitsFactory;

    [address1, address2] = await viem.getWalletClients();
    address1Validated = validateAddress(address1);
    address2Validated = validateAddress(address2);

    publicClient = await viem.getPublicClient();
  });

  it("should create PullSplits contract", async () => {
    // address1とaddress2に50%ずつ配分するSplitを作成
    const txHash = await PullSplitsFactory.write.createSplit([
      {
        recipients: [address1Validated, address2Validated],
        allocations: [50n, 50n],
        totalAllocation: 100n,
        distributionIncentive: 0,
      },
      address1Validated,
      address1Validated,
    ]);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    let splitAddress: Address | undefined;

    for (const log of receipt.logs) {
      try {
        const decodedLog = decodeEventLog({
          abi: PullSplitsFactory.abi,
          data: log.data,
          topics: log.topics,
        });
        if (decodedLog.eventName === "SplitCreated") {
          splitAddress = decodedLog.args.split;
        }
      } catch (error) {}
    }

    if (!splitAddress) {
      throw new Error("Split address not found in transaction logs");
    }

    DeployedPullSplit = await viem.getContractAt("PullSplit", splitAddress);
  });

  it("Should destribute", async () => {
    if (!address1.account) {
      throw new Error("address1 account is undefined");
    }

    // 1ETHをSplitコントラクトに送金 → distribute() → withdraw() → 残高が増えたか検証
    await address1.sendTransaction({
      account: address1.account,
      to: DeployedPullSplit.address,
      value: parseEther("1"),
      chain: undefined,
    });

    const beforeAddress2Balance = await publicClient.getBalance({
      address: address2Validated,
    });

    // ETHをERC-20のように扱うための慣習的なダミーアドレス
    const ETH_TOKEN_ADDRESS =
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    // Pull型の分配を実行
    // 1ETHをaddress1とaddress2に50%ずつ分配
    // 送信元（tx.from）はaddress1
    await DeployedPullSplit.write.distribute(
      [
        {
          recipients: [address1Validated, address2Validated],
          allocations: [50n, 50n],
          totalAllocation: 100n,
          distributionIncentive: 0, // 実行者へのインセンティブ（=手数料）
        },
        ETH_TOKEN_ADDRESS, //「分配対象トークン」のアドレス
        address1Validated, // 分配トリガーを引く人（引数上の sender）
      ],
      {
        account: address1.account,
      },
    );

    // withdrawを実行し、各受取人が自分の報酬を引き出せるか
    // address1 が「自分の ETH 報酬」を SplitsWarehouse から withdraw() してる。
    await SplitsWarehouse.write.withdraw(
      [address1Validated, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"],
      {
        account: address1.account, // msg.sender
      },
    );

    await SplitsWarehouse.write.withdraw(
      [address2Validated, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"],
      {
        account: address2.account,
      },
    );

    const afterAddress2Balance = await publicClient.getBalance({
      address: address2Validated,
    });

    // withdrawのガス代を引いて大体0.5ETH増えているはず
    // 宅急便の着払いみたいなイメージ
    expect(Number(afterAddress2Balance) - Number(beforeAddress2Balance)).gt(
      499900000000000000,
    );
  });
});
