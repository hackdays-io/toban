import {ZeroAddress} from "ethers";
import {deployForwarder} from "../modules/Forwarder";
import {deployFractionToken} from "../modules/FractionToken";
import {deployHatsProtocol} from "../modules/Hats";
import {deploySplitCreator, deploySplitsProtocol} from "../modules/Splits";

const main = async () => {
  const {
    SplitsWarehouse,
    PullSplitsFactory,
    PushSplitsFactory,
    SampleForwarder,
  } = await deploySplitsProtocol();
  const {Hats} = await deployHatsProtocol();

  const {Forwarder} = await deployForwarder();
  const {FractionToken} = await deployFractionToken(
    "",
    await Hats.getAddress(),
    await Forwarder.getAddress()
  );
  const {SplitCreator} = await deploySplitCreator(
    await PullSplitsFactory.getAddress(),
    await FractionToken.getAddress(),
    await Forwarder.getAddress()
  );

  console.log("------ Deployed contracts ------");
  console.log("SplitsWarehouse: ", await SplitsWarehouse.getAddress());
  console.log("PullSplitsFactory: ", await PullSplitsFactory.getAddress());
  console.log("PushSplitsFactory: ", await PushSplitsFactory.getAddress());
  console.log("Hats: ", await Hats.getAddress());
  console.log("Forwarder: ", await Forwarder.getAddress());
  console.log("FractionToken: ", await FractionToken.getAddress());
  console.log("SplitCreator: ", await SplitCreator.getAddress());
};

main();
