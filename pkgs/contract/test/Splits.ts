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

    // Splitコントラクトに1ETH送金
    await address1.sendTransaction({
      account: address1.account,
      to: DeployedPullSplit.address,
      value: parseEther("1"),
      chain: undefined,
    });

    const beforeAddress2Balance = await publicClient.getBalance({
      address: address2Validated,
    });

    await DeployedPullSplit.write.distribute(
      [
        {
          recipients: [address1Validated, address2Validated],
          allocations: [50n, 50n],
          totalAllocation: 100n,
          distributionIncentive: 0,
        },
        "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        address1Validated,
      ],
      {
        account: address1.account,
      },
    );

    // withdrawを実行
    await SplitsWarehouse.write.withdraw(
      [address1Validated, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"],
      {
        account: address1.account,
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
    expect(Number(afterAddress2Balance) - Number(beforeAddress2Balance)).gt(
      499900000000000000,
    );
  });
});
