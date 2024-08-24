import {network} from "hardhat";
import {writeContractAddress} from "../../helper/contractsJsonHelper";
import {deployForwarder} from "../modules/Forwarder";
import {deployFractionToken} from "../modules/FractionToken";
import {deploySplitCreator} from "../modules/Splits";
import {deployTimeFrameHatModule} from "../modules/TimeFrameHatModule";

const main = async () => {
  const hatsAddress = "0x3bc1A0Ad72417f2d411118085256fC53CBdDd137";
  const splitFactoryAddress = "0x80f1B766817D04870f115fEBbcCADF8DBF75E017";
  const {Forwarder} = await deployForwarder();
  const {TimeFrameHatModule} = await deployTimeFrameHatModule(
    hatsAddress,
    await Forwarder.getAddress()
  );
  const {FractionToken} = await deployFractionToken(
    "https://aquamarine-scornful-blackbird-197.mypinata.cloud/ipfs/QmS59SdrcjxrM5VMXscDp7dYxzhtdvZGLDCjAyWgqkDM4Z",
    hatsAddress,
    await Forwarder.getAddress()
  );
  const {SplitCreator} = await deploySplitCreator(
    splitFactoryAddress,
    await FractionToken.getAddress(),
    await Forwarder.getAddress()
  );

  console.log("Forwarder deployed to:", await Forwarder.getAddress());
  writeContractAddress({
    group: "contracts",
    name: "Forwarder",
    value: await Forwarder.getAddress(),
    network: network.name,
  });

  console.log(
    "TimeFrameHatModule deployed to:",
    await TimeFrameHatModule.getAddress()
  );
  writeContractAddress({
    group: "contracts",
    name: "TimeFrameHatModule",
    value: await TimeFrameHatModule.getAddress(),
    network: network.name,
  });

  console.log("FractionToken deployed to:", await FractionToken.getAddress());
  writeContractAddress({
    group: "contracts",
    name: "FractionToken",
    value: await FractionToken.getAddress(),
    network: network.name,
  });

  console.log("SplitCreator deployed to:", await SplitCreator.getAddress());
  writeContractAddress({
    group: "contracts",
    name: "SplitCreator",
    value: await SplitCreator.getAddress(),
    network: network.name,
  });
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
