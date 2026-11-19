import type { Address } from "viem";
import { ethers, networkName } from "../../helpers/connection";
import { deployBigBang } from "../../helpers/deploy/BigBang";
// import { deployFractionToken } from "../../helpers/deploy/FractionToken";
import {
  deployHatsFractionTokenModule,
  deployHatsHatCreatorModule,
  deployHatsQuestModule,
  deployHatsTimeFrameModule,
} from "../../helpers/deploy/Hats";
import {
  deployScheduledDistributor,
  deployScheduledDistributorFactory,
} from "../../helpers/deploy/ScheduledDistributor";
import {
  deploySplitsCreator,
  deploySplitsCreatorFactory,
} from "../../helpers/deploy/Splits";
import {
  deployThanksToken,
  deployThanksTokenFactory,
} from "../../helpers/deploy/ThanksToken";
import { writeContractAddress } from "../../helpers/deploy/contractsJsonHelper";

const deploy = async () => {
  console.log(
    "##################################### [Create2 Deploy START] #####################################",
  );

  const [deployerSigner] = await ethers.getSigners();
  const deployerAddress = await deployerSigner.getAddress();

  // Deploy HatsTimeFrameModule (non-upgradeable)
  const { HatsTimeFrameModule } = await deployHatsTimeFrameModule("0.0.0");
  const hatsTimeFrameModuleAddress = HatsTimeFrameModule.address;

  const { HatsHatCreatorModule } = await deployHatsHatCreatorModule("0.0.0"); // zero address 以外のアドレスを仮に渡す
  const hatsHatCreatorModuleAddress = HatsHatCreatorModule.address;

  const { HatsFractionTokenModule } =
    await deployHatsFractionTokenModule("0.0.0");
  const hatsFractionTokenModuleAddress = HatsFractionTokenModule.address;

  const { HatsQuestModule } = await deployHatsQuestModule("0.0.0");
  const hatsQuestModuleAddress = HatsQuestModule.address;

  console.log("Deploying ThanksToken...");
  const { ThanksToken } = await deployThanksToken();
  const thanksTokenAddress = ThanksToken.address;

  console.log("Deploying ThanksTokenFactory...");

  const {
    ThanksTokenFactory,
    ThanksTokenFactoryImplAddress,
    ThanksTokenFactoryInitData,
  } = await deployThanksTokenFactory({
    initialOwner: deployerAddress as Address,
    implementation: thanksTokenAddress,
    hatsAddress: process.env.HATS_ADDRESS as Address,
  });
  const thanksTokenFactoryAddress = ThanksTokenFactory.address;

  // Deploy SplitsCreator (non-upgradeable)
  const { SplitsCreator } = await deploySplitsCreator();
  const splitsCreatorAddress = SplitsCreator.address;

  // Deploy SplitsCreatorFactory implementation and proxy
  console.log("Deploying SplitsCreatorFactory...");

  const {
    SplitsCreatorFactory,
    SplitsCreatorFactoryImplAddress,
    SplitsCreatorFactoryInitData,
  } = await deploySplitsCreatorFactory(splitsCreatorAddress);
  const splitsCreatorFactoryAddress = SplitsCreatorFactory.address;

  // Deploy ScheduledDistributor implementation (Clone target) and its factory.
  // Not wired through BigBang — workspaces opt in by calling the factory
  // directly when they want to schedule a distribution.
  console.log("Deploying ScheduledDistributor...");
  const { ScheduledDistributor, ScheduledDistributorImplAddress } =
    await deployScheduledDistributor();
  const scheduledDistributorAddress = ScheduledDistributor.address;

  console.log("Deploying ScheduledDistributorFactory...");
  const {
    ScheduledDistributorFactory,
    ScheduledDistributorFactoryImplAddress,
    ScheduledDistributorFactoryInitData,
  } = await deployScheduledDistributorFactory({
    initialOwner: deployerAddress as Address,
    implementation: scheduledDistributorAddress,
    hatsAddress: process.env.HATS_ADDRESS as Address,
  });
  const scheduledDistributorFactoryAddress =
    ScheduledDistributorFactory.address;

  // Deploy BigBang implementation and proxy
  console.log("Deploying BigBang...");

  const { BigBang, BigBangImplAddress, BigBangInitData } = await deployBigBang({
    hatsContractAddress: process.env.HATS_ADDRESS as Address,
    hatsModuleFacotryAddress: process.env
      .HATS_MODULE_FACTORY_ADDRESS as Address,
    hatsTimeFrameModule_impl: hatsTimeFrameModuleAddress,
    hatsHatCreatorModule_impl: hatsHatCreatorModuleAddress,
    hatsFractionTokenModule_impl: hatsFractionTokenModuleAddress,
    hatsQuestModule_impl: hatsQuestModuleAddress,
    splitsCreatorFactoryAddress: splitsCreatorFactoryAddress,
    splitsFactoryV2Address: process.env.PULL_SPLITS_FACTORY_ADDRESS as Address,
    thanksTokenFactoryAddress: thanksTokenFactoryAddress,
  });
  const bigBangAddress = BigBang.address;

  // Set bigbang address to splits creator factory
  const SplitsCreatorFactoryContract = await ethers.getContractAt(
    "SplitsCreatorFactory",
    splitsCreatorFactoryAddress,
  );
  await SplitsCreatorFactoryContract.setBigBang(bigBangAddress);

  // Set bigbang address to thanks token factory
  const ThanksTokenFactoryContract = await ethers.getContractAt(
    "ThanksTokenFactory",
    thanksTokenFactoryAddress,
  );
  await ThanksTokenFactoryContract.setBigBang(bigBangAddress);

  console.log("Successfully deployed contracts!🎉");
  console.log("Verify contract with these commands...\n");

  console.log(
    "HatsTimeframeModule module:\n",
    `pnpm contract hardhat verify ${hatsTimeFrameModuleAddress} 0.0.0 --network ${networkName}\n`,
  );
  console.log(
    "HatsHatCreatorModule module:\n",
    `pnpm contract hardhat verify ${hatsHatCreatorModuleAddress} 0.0.0 --network ${networkName}\n`,
  );
  console.log(
    "HatsFractionTokenModule:\n",
    `pnpm contract hardhat verify ${hatsFractionTokenModuleAddress} 0.0.0 --network ${networkName}\n`,
  );
  console.log(
    "HatsQuestModule:\n",
    `pnpm contract hardhat verify ${hatsQuestModuleAddress} 0.0.0 --network ${networkName}\n`,
  );
  console.log(
    "ThanksToken:\n",
    `pnpm contract hardhat verify ${thanksTokenAddress} --network ${networkName}\n`,
  );
  console.log(
    "ThanksTokenFactory:\n",
    `pnpm contract hardhat verify ${ThanksTokenFactoryImplAddress} --network ${networkName} &&`,
    `pnpm contract hardhat verify ${thanksTokenFactoryAddress} ${ThanksTokenFactoryImplAddress} ${ThanksTokenFactoryInitData} --network ${networkName}\n`,
  );
  console.log(
    "SplitsCreator:\n",
    `pnpm contract hardhat verify ${splitsCreatorAddress} --network ${networkName}\n`,
  );
  console.log(
    "SplitsCreatorFactory:\n",
    `pnpm contract hardhat verify ${SplitsCreatorFactoryImplAddress} --network ${networkName} &&`,
    `pnpm contract hardhat verify ${splitsCreatorFactoryAddress} ${SplitsCreatorFactoryImplAddress} ${SplitsCreatorFactoryInitData} --network ${networkName}\n`,
  );
  console.log(
    "ScheduledDistributor:\n",
    `pnpm contract hardhat verify ${scheduledDistributorAddress} --network ${networkName}\n`,
  );
  console.log(
    "ScheduledDistributorFactory:\n",
    `pnpm contract hardhat verify ${ScheduledDistributorFactoryImplAddress} --network ${networkName} &&`,
    `pnpm contract hardhat verify ${scheduledDistributorFactoryAddress} ${ScheduledDistributorFactoryImplAddress} ${ScheduledDistributorFactoryInitData} --network ${networkName}\n`,
  );
  console.log(
    "BigBang:\n",
    `pnpm contract hardhat verify ${BigBangImplAddress} --network ${networkName} &&`,
    `pnpm contract hardhat verify ${bigBangAddress} ${BigBangImplAddress} ${BigBangInitData} --network ${networkName}`,
  );

  // Save non-upgradeable contracts
  writeContractAddress({
    group: "contracts",
    name: "HatsTimeFrameModule",
    value: hatsTimeFrameModuleAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "contracts",
    name: "ThanksTokenFactory_Implementation",
    value: ThanksTokenFactoryImplAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "contracts",
    name: "SplitsCreator",
    value: splitsCreatorAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "contracts",
    name: "ScheduledDistributor",
    value: scheduledDistributorAddress,
    network: networkName,
  });

  // Save upgradeable contracts implementations
  writeContractAddress({
    group: "implementations",
    name: "SplitsCreatorFactory_Implementation",
    value: SplitsCreatorFactoryImplAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "implementations",
    name: "ScheduledDistributorFactory_Implementation",
    value: ScheduledDistributorFactoryImplAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "implementations",
    name: "BigBang_Implementation",
    value: BigBangImplAddress,
    network: networkName,
  });

  // Save upgradeable contracts proxies
  writeContractAddress({
    group: "contracts",
    name: "HatsTimeFrameModule",
    value: hatsTimeFrameModuleAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "contracts",
    name: "ThanksTokenFactory",
    value: thanksTokenFactoryAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "contracts",
    name: "SplitsCreatorFactory",
    value: splitsCreatorFactoryAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "contracts",
    name: "ScheduledDistributorFactory",
    value: scheduledDistributorFactoryAddress,
    network: networkName,
  });
  writeContractAddress({
    group: "contracts",
    name: "BigBang",
    value: bigBangAddress,
    network: networkName,
  });

  console.log(
    "\n##################################### [Create2 Deploy END] #####################################",
  );
};

deploy();
