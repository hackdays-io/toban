import * as dotenv from "dotenv";
import { network } from "hardhat";
import { type Address, zeroAddress } from "viem";
import { deployBigBang } from "../../helpers/deploy/BigBang";
import { deployFractionToken } from "../../helpers/deploy/FractionToken";
import { deployHatsTimeFrameModule } from "../../helpers/deploy/Hats";
import {
  deploySplitsCreator,
  deploySplitsCreatorFactory,
} from "../../helpers/deploy/Splits";
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

  const { FractionToken } = await deployFractionToken(
    "",
    10000n,
    Hats as Address,
  );

  const { SplitsCreator } = await deploySplitsCreator();

  const { SplitsCreatorFactory } = await deploySplitsCreatorFactory(
    SplitsCreator.address,
  );

  const { BigBang } = await deployBigBang({
    hatsContractAddress: Hats as Address,
    hatsModuleFacotryAddress: HatsModuleFactory as Address,
    hatsTimeFrameModule_impl: HatsTimeFrameModule.address,
    splitsCreatorFactoryAddress: SplitsCreatorFactory.address,
    splitsFactoryV2Address: PullSplitsFactory as Address,
    fractionTokenAddress: FractionToken.address,
  });

  console.log("BigBang deployed at", BigBang.address);
  console.log("FractionToken deployed at", FractionToken.address);
  console.log("SplitsCreatorFactory deployed at", SplitsCreatorFactory.address);
  console.log("SplitsCreator deployed at", SplitsCreator.address);
  console.log("HatsTimeFrameModule deployed at", HatsTimeFrameModule.address);

  // デプロイしたアドレスをjsonファイルに保存する。
  writeContractAddress({
    group: "contracts",
    name: "BigBang",
    value: BigBang.address,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "FractionToken",
    value: FractionToken.address,
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

  console.log(
    "##################################### [Deploy END] #####################################",
  );

  return;
};

deployAll();
