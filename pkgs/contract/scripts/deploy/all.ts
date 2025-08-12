import * as dotenv from "dotenv";
import { network } from "hardhat";
import type { Address } from "viem";
import { deployBigBang } from "../../helpers/deploy/BigBang";
import {
  deployHatsFractionTokenModule,
  deployHatsHatCreatorModule,
  deployHatsTimeFrameModule,
} from "../../helpers/deploy/Hats";
import {
  deploySplitsCreator,
  deploySplitsCreatorFactory,
} from "../../helpers/deploy/Splits";
import { deployThanksToken } from "../../helpers/deploy/ThanksToken";
import {
  loadDeployedContractAddresses,
  writeContractAddress,
} from "../../helpers/deploy/contractsJsonHelper";

dotenv.config();

/**
 * Deploy all contracts
 * @returns
 */
const deployAll = async () => {
  console.log(
    "##################################### [Deploy START] #####################################",
  );

  // Hats HatsModuleFactory PullSplitsFactoryコントラクトの各アドレスをjsonファイルから取得してくる。
  const {
    contracts: { Hats, HatsModuleFactory, PullSplitsFactory },
  } = loadDeployedContractAddresses(network.name);

  const { HatsTimeFrameModule } = await deployHatsTimeFrameModule();
  const { HatsHatCreatorModule } = await deployHatsHatCreatorModule(
    "0x0000000000000000000000000000000000000001", // zero address 以外のアドレスを仮に渡す
  );
  const { HatsFractionTokenModule } = await deployHatsFractionTokenModule();

  const { ThanksToken } = await deployThanksToken();

  const { SplitsCreator } = await deploySplitsCreator();

  const { SplitsCreatorFactory } = await deploySplitsCreatorFactory(
    SplitsCreator.address,
  );

  const { BigBang } = await deployBigBang({
    hatsContractAddress: Hats as Address,
    hatsModuleFacotryAddress: HatsModuleFactory as Address,
    hatsTimeFrameModule_impl: HatsTimeFrameModule.address,
    hatsHatCreatorModule_impl: HatsHatCreatorModule.address,
    hatsFractionTokenModule_impl: HatsFractionTokenModule.address,
    splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
    splitsFactoryV2Address: PullSplitsFactory as Address,
    thanksTokenFactoryAddress: ThanksToken.address,
  });

  console.log("BigBang deployed at", BigBang.address);
  console.log("ThanksToken deployed at", ThanksToken.address);
  console.log("SplitsCreatorFactory deployed at", SplitsCreatorFactory.address);
  console.log("SplitsCreator deployed at", SplitsCreator.address);
  console.log("HatsTimeFrameModule deployed at", HatsTimeFrameModule.address);
  console.log(
    "HatsFractionTokenModule deployed at",
    HatsFractionTokenModule.address,
  );

  // デプロイしたアドレスをjsonファイルに保存する。
  writeContractAddress({
    group: "contracts",
    name: "BigBang",
    value: BigBang.address,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "ThanksToken",
    value: ThanksToken.address,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "SplitsCreatorFactory",
    value: SplitsCreatorFactory.address,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "SplitsCreator",
    value: SplitsCreator.address,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "HatsTimeFrameModule",
    value: HatsTimeFrameModule.address,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "HatsFractionTokenModule",
    value: HatsFractionTokenModule.address,
    network: network.name,
  });

  // 実装アドレスも保存
  writeContractAddress({
    group: "implementations",
    name: "HatsTimeFrameModule_Implementation",
    value: HatsTimeFrameModule.address,
    network: network.name,
  });
  writeContractAddress({
    group: "implementations",
    name: "HatsFractionTokenModule_Implementation",
    value: HatsFractionTokenModule.address,
    network: network.name,
  });

  console.log(
    "##################################### [Deploy END] #####################################",
  );

  return;
};

deployAll();
