import { network, viem } from "hardhat";
import { deployHatsTimeFrameModule } from "../../helpers/deploy/Hats";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

const upgrade = async () => {
  const module = await deployHatsTimeFrameModule(
    "0x0000000000000000000000000000000000000001",
  );

  // Load BigBang address from outputs JSON file
  const {
    contracts: { BigBang },
  } = loadDeployedContractAddresses(network.name);

  const bigBang = await viem.getContractAt("BigBang", BigBang);

  await bigBang.write.setHatsTimeFrameModuleImpl([
    module.HatsTimeFrameModule.address,
  ]);

  console.log(
    "HatsTimeframeModule module:\n",
    `npx hardhat verify ${module.HatsTimeFrameModule.address} "0.0.0" 0x0000000000000000000000000000000000000001 --network ${network.name}\n`,
  );
};

upgrade();
