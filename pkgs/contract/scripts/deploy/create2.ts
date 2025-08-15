import { ethers, network } from "hardhat";
import type { Address } from "viem";
import { deployBigBang } from "../../helpers/deploy/BigBang";
// import { deployFractionToken } from "../../helpers/deploy/FractionToken";
import {
  deployHatsFractionTokenModule,
  deployHatsHatCreatorModule,
  deployHatsTimeFrameModule,
} from "../../helpers/deploy/Hats";
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

  // Deploy SplitsCreator (non-upgradeable)
  const { SplitsCreator } = await deploySplitsCreator();
  const splitsCreatorAddress = SplitsCreator.address;

  // Deploy FractionToken implementation and proxy
  console.log("Deploying FractionToken...");

  // const { FractionToken, FractionTokenImplAddress, FractionTokenInitData } =
  //   await deployFractionToken("", 10000n, process.env.HATS_ADDRESS as Address);
  // const fractionTokenAddress = FractionToken.address;

  const { HatsFractionTokenModule } =
    await deployHatsFractionTokenModule("0.0.0");
  const hatsFractionTokenModuleAddress = HatsFractionTokenModule.address;

  // Deploy SplitsCreatorFactory implementation and proxy
  console.log("Deploying SplitsCreatorFactory...");

  const {
    SplitsCreatorFactory,
    SplitsCreatorFactoryImplAddress,
    SplitsCreatorFactoryInitData,
  } = await deploySplitsCreatorFactory(splitsCreatorAddress);
  const splitsCreatorFactoryAddress = SplitsCreatorFactory.address;

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
    fractionTokenAddress: hatsFractionTokenModuleAddress,
    hatsTimeFrameModuleAddress: hatsTimeFrameModuleAddress,
  });
  const thanksTokenFactoryAddress = ThanksTokenFactory.address;

  // Deploy BigBang implementation and proxy
  console.log("Deploying BigBang...");

  const { BigBang, BigBangImplAddress, BigBangInitData } = await deployBigBang({
    hatsContractAddress: process.env.HATS_ADDRESS as Address,
    hatsModuleFacotryAddress: process.env
      .HATS_MODULE_FACTORY_ADDRESS as Address,
    hatsTimeFrameModule_impl: hatsTimeFrameModuleAddress,
    hatsHatCreatorModule_impl: hatsHatCreatorModuleAddress,
    hatsFractionTokenModule_impl: hatsFractionTokenModuleAddress,
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
    `pnpm contract hardhat verify ${hatsTimeFrameModuleAddress} 0.0.0 --network ${network.name}\n`,
  );
  console.log(
    "HatsHatCreatorModule module:\n",
    `pnpm contract hardhat verify ${hatsHatCreatorModuleAddress} 0.0.0 --network ${network.name}\n`,
  );
  console.log(
    "HatsFractionTokenModule:\n",
    `pnpm contract hardhat verify ${hatsFractionTokenModuleAddress} 0.0.0 --network ${network.name}\n`,
  );
  console.log(
    "ThanksTokenFactory:\n",
    `pnpm contract hardhat verify ${thanksTokenFactoryAddress} --network ${network.name} &&`,
    `pnpm contract hardhat verify ${thanksTokenFactoryAddress} ${ThanksTokenFactoryImplAddress} ${ThanksTokenFactoryInitData} --network ${network.name}\n`,
  );
  console.log(
    "SplitsCreator:\n",
    `pnpm contract hardhat verify ${splitsCreatorAddress} --network ${network.name}\n`,
  );
  console.log(
    "SplitsCreatorFactory:\n",
    `pnpm contract hardhat verify ${SplitsCreatorFactoryImplAddress} --network ${network.name} &&`,
    `pnpm contract hardhat verify ${splitsCreatorFactoryAddress} ${SplitsCreatorFactoryImplAddress} ${SplitsCreatorFactoryInitData} --network ${network.name}\n`,
  );
  console.log(
    "BigBang:\n",
    `pnpm contract hardhat verify ${BigBangImplAddress} --network ${network.name} &&`,
    `pnpm contract hardhat verify ${bigBangAddress} ${BigBangImplAddress} ${BigBangInitData} --network ${network.name}`,
  );

  // Save non-upgradeable contracts
  writeContractAddress({
    group: "contracts",
    name: "HatsTimeFrameModule",
    value: hatsTimeFrameModuleAddress,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "ThanksTokenFactory_Implementation",
    value: ThanksTokenFactoryImplAddress,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "SplitsCreator",
    value: splitsCreatorAddress,
    network: network.name,
  });

  // Save upgradeable contracts implementations
  writeContractAddress({
    group: "implementations",
    name: "SplitsCreatorFactory_Implementation",
    value: SplitsCreatorFactoryImplAddress,
    network: network.name,
  });
  writeContractAddress({
    group: "implementations",
    name: "BigBang_Implementation",
    value: BigBangImplAddress,
    network: network.name,
  });

  // Save upgradeable contracts proxies
  writeContractAddress({
    group: "contracts",
    name: "HatsTimeFrameModule",
    value: hatsTimeFrameModuleAddress,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "ThanksTokenFactory",
    value: thanksTokenFactoryAddress,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "SplitsCreatorFactory",
    value: splitsCreatorFactoryAddress,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "BigBang",
    value: bigBangAddress,
    network: network.name,
  });

  console.log(
    "\n##################################### [Create2 Deploy END] #####################################",
  );
};

deploy();
