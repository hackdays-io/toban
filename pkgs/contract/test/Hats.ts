import { ethers } from "hardhat"
import { Hats } from "../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { ZeroAddress } from "ethers"

describe("Hats", () => {
  let Hats: Hats

  let address1: SignerWithAddress

  before(async () => {
    const factory = await ethers.getContractFactory("Hats")
    Hats = await factory.deploy("test", "https://test.com")
    await Hats.waitForDeployment()

    ;[address1] = await ethers.getSigners()
  })

  it("should create top hat", async () => {
    const tx = await address1.sendTransaction({
      to: await Hats.getAddress(),
      data: "0x1a64dfad000000000000000000000000f39Fd6e51aad88F6F4ce6aB8827279cffFb92266000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000042697066733a2f2f6261666b7265696161363537346a67347865746a7335786c727267767078746d6f7a667a6264766762767570376533737033326c667a3337746d610000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000042697066733a2f2f62616679626569646567676e3274706b737867336362696d6177326776363275686766697574617a3263736135643663367a7472667379746b6b75000000000000000000000000000000000000000000000000000000000000"
    })

    const receipt = await tx.wait()

    const getTransaction = await ethers.provider.getTransactionReceipt(receipt?.hash || "")
    
    const uri = await Hats.hatSupply('0x0000000100000000000000000000000000000000000000000000000000000000')

    const test = await Hats.createHat('0x0000000100000000000000000000000000000000000000000000000000000000', "test", 10, "0x0000000000000000000000000000000000004a75", "0x0000000000000000000000000000000000004a75", true, "test")

    const receip = await test.wait()

    const log = receip?.logs.find((l: any) => l.fragment?.name === "HatCreated") as any
    const id = log?.args[0] as `0x${string}`

    console.log(id)
    const parent = await Hats.getHatLevel(id)

    console.log("parent", parent)

    const child = await Hats.createHat(id, "test", 10, "0x0000000000000000000000000000000000004a75", "0x0000000000000000000000000000000000004a75", true, "test")

    const receipt2 = await child.wait()

    const log2 = receipt2?.logs.find((l: any) => l.fragment?.name === "HatCreated") as any
    const id2 = log2?.args[0] as `0x${string}`
    console.log(id2)

    const parent2 = await Hats.getHatLevel(id2)

    console.log("parent2", parent2)

    // let tx = await Hats.connect(address1).mintTopHat("Top Hat", "Description", "https://test.com/tophat.png")

    // let receipt = await tx.wait()

    // console.log(receipt)
  })
})