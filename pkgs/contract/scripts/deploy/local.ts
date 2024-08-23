import {deployHatsProtocol} from "../modules/Hats";
import {deploySplitsProtocol} from "../modules/Splits";

const main = async () => {
  const {SplitsWarehouse, PullSplitsFactory, PushSplitsFactory} =
    await deploySplitsProtocol();
  const {Hats} = await deployHatsProtocol();

  console.log("------ Deployed contracts ------");
  console.log("SplitsWarehouse: ", await SplitsWarehouse.getAddress());
  console.log("PullSplitsFactory: ", await PullSplitsFactory.getAddress());
  console.log("PushSplitsFactory: ", await PushSplitsFactory.getAddress());
  console.log("Hats: ", await Hats.getAddress());
};

main();
