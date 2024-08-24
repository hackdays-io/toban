import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {Hats, TimeFrameHatModule} from "../typechain-types";
import {deployHatsProtocol} from "./helper/deploy";
import {deployTimeFrameHatModule} from "../scripts/modules/TimeFrameHatModule";
import {ZeroAddress} from "ethers";
import {expect} from "chai";
import {time} from "@nomicfoundation/hardhat-network-helpers";

describe("Timeframe", () => {
  let Hats: Hats;
  let TimeFrameHatModule: TimeFrameHatModule;

  let address1: SignerWithAddress;
  let address2: SignerWithAddress;

  let hatterHatId: `0x${string}`;
  let roleHatId: `0x${string}`;

  before(async () => {
    const {Hats: _Hats} = await deployHatsProtocol();
    Hats = _Hats;

    const {TimeFrameHatModule: _TimeFrameHatModule} =
      await deployTimeFrameHatModule(await Hats.getAddress(), ZeroAddress);
    TimeFrameHatModule = _TimeFrameHatModule;

    [address1, address2] = await ethers.getSigners();

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

  it("Should create hatter hat and mint to the module", async () => {
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
    hatterHatId = log?.args[0] as `0x${string}`;

    tx = await Hats.mintHat(hatterHatId, await TimeFrameHatModule.getAddress());
  });

  it("Create new hat under hatter hat", async () => {
    let tx = await Hats.createHat(
      hatterHatId,
      "roleHat",
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
    roleHatId = log?.args[0] as `0x${string}`;
  });

  it("Mint through the module", async () => {
    let tx = await TimeFrameHatModule.mintHat(roleHatId, address2.address);
    await tx.wait();

    expect(await Hats.balanceOf(address2.address, roleHatId)).to.equal(1);

    await time.increase(3000);

    const elipse = await TimeFrameHatModule.getWearingElapsedTime(
      address2.address,
      roleHatId
    );
    expect(elipse).to.equal(3000);
  });
});
