import { network, viem } from "hardhat";
import { deployHatsHatCreatorModule } from "../../helpers/deploy/Hats";

const upgrade = async () => {
  const module = await deployHatsHatCreatorModule(
    "0x0000000000000000000000000000000000000001",
  );

  const bigBang = await viem.getContractAt(
    "BigBang",
    "0x3E70d10aCdcC14B6C31DA26DcC195a6EDf1C2c16",
  );

  await bigBang.write.setHatsHatCreatorModuleImpl([
    module.HatsHatCreatorModule.address,
  ]);

  console.log(
    "HatsHatCreatorModule module:\n",
    `npx hardhat verify ${module.HatsHatCreatorModule.address} "0.0.0" 0x0000000000000000000000000000000000000001 --network ${network.name}\n`,
  );
};

upgrade();
