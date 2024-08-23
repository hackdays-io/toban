import { ethers } from "hardhat"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { parseEther } from "ethers"
import { PullSplitFactory, PushSplitFactory, SplitsWarehouse } from "../typechain-types"

describe("Splits", () => {
  let SplitsWarehouse: SplitsWarehouse
  let PullSplitsFactory: PullSplitFactory
  let PushSplitsFactory: PushSplitFactory

  let address1: SignerWithAddress
  let address2: SignerWithAddress

  before(async () => {
    const warehouseFactory = await ethers.getContractFactory("SplitsWarehouse")
    SplitsWarehouse = await warehouseFactory.deploy("ETH", "ETH")
    await SplitsWarehouse.waitForDeployment()

    const pullFactory = await ethers.getContractFactory("PullSplitFactory")
    PullSplitsFactory = await pullFactory.deploy(
      await SplitsWarehouse.getAddress()
    )

    const pushFactory = await ethers.getContractFactory("PushSplitFactory")
    PushSplitsFactory = await pushFactory.deploy(
      await SplitsWarehouse.getAddress()
    )
    ;[address1, address2] = await ethers.getSigners()
  })

  it("should return the correct splits", async () => {
    const address2Before = await ethers.provider.getBalance(address2.address)
    console.log("Address 2 Balance Before: ", address2Before.toString())

    const split = await PullSplitsFactory.createSplit(
      {
        recipients: [address1.address, address2.address],
        allocations: [50, 50],
        totalAllocation: 100,
        distributionIncentive: 0,
      },
      address1.address,
      address1.address
    )

    const splitResult = await split.wait()

    const splitAddress = (
      splitResult?.logs.find(
        (l: any) => l.fragment?.name === "SplitCreated"
      ) as any
    ).args[0]

    await address1.sendTransaction({
      to: splitAddress,
      value: parseEther("1"),
    })

    const splitter = await ethers.getContractAt("PullSplit", splitAddress)

    await splitter[
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
    )

    await SplitsWarehouse.connect(address2)["withdraw(address,address)"](
      address2.address,
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    )

    const address2Balance = await ethers.provider.getBalance(address2.address)

    console.log("Split Balance: ", address2Balance.toString())
  })
})
