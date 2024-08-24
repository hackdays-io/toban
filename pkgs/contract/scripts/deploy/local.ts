import {ZeroAddress} from "ethers";
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

  const {FractionToken: _FractionToken} = await deployFractionToken(
    "",
    await Hats.getAddress(),
    ZeroAddress
  );
  let FractionToken = _FractionToken;

  const {SplitCreator} = await deploySplitCreator(
    await PullSplitsFactory.getAddress(),
    await FractionToken.getAddress(),
    await SampleForwarder.getAddress()
  );

  console.log("------ Deployed contracts ------");
  console.log("SplitsWarehouse: ", await SplitsWarehouse.getAddress());
  console.log("PullSplitsFactory: ", await PullSplitsFactory.getAddress());
  console.log("PushSplitsFactory: ", await PushSplitsFactory.getAddress());
  console.log("Hats: ", await Hats.getAddress());
  console.log("SplitCreator: ", await SplitCreator.getAddress());
};

main();
