import {deployHatsProtocol} from "../modules/Hats";
import {deploySplitCreator, deploySplitsProtocol} from "../modules/Splits";

const main = async () => {
  const {SplitsWarehouse, PullSplitsFactory, PushSplitsFactory} =
    await deploySplitsProtocol();
  const {Hats} = await deployHatsProtocol();

  const {SplitCreator} = await deploySplitCreator(
    await PullSplitsFactory.getAddress()
  );

  console.log("------ Deployed contracts ------");
  console.log("SplitsWarehouse: ", await SplitsWarehouse.getAddress());
  console.log("PullSplitsFactory: ", await PullSplitsFactory.getAddress());
  console.log("PushSplitsFactory: ", await PushSplitsFactory.getAddress());
  console.log("Hats: ", await Hats.getAddress());
  console.log("SplitCreator: ", await SplitCreator.getAddress());
};

main();
