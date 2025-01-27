import { ethers, network } from "hardhat";
import type { Address } from "viem";
import { deployBigBang } from "../../helpers/deploy/BigBang";
import { deployFractionToken } from "../../helpers/deploy/FractionToken";
import {
  deployHatsHatCreatorModule,
  deployHatsTimeFrameModule,
} from "../../helpers/deploy/Hats";
import {
  deploySplitsCreator,
  deploySplitsCreatorFactory,
} from "../../helpers/deploy/Splits";
import { writeContractAddress } from "../../helpers/deploy/contractsJsonHelper";

const deploy = async () => {
  console.log(
    "##################################### [Create2 Deploy START] #####################################",
  );

  // Deploy HatsTimeFrameModule (non-upgradeable)
  const { HatsTimeFrameModule } = await deployHatsTimeFrameModule(
    "0x0000000000000000000000000000000000000001",
    "0.0.0",
  );
  const hatsTimeFrameModuleAddress = HatsTimeFrameModule.address;

  const { HatsHatCreatorModule } = await deployHatsHatCreatorModule(
    "0x0000000000000000000000000000000000000001",
    "0.0.0",
  ); // zero address 以外のアドレスを仮に渡す
  const hatsHatCreatorModuleAddress = HatsHatCreatorModule.address;

  // Deploy SplitsCreator (non-upgradeable)
  const { SplitsCreator } = await deploySplitsCreator();
  const splitsCreatorAddress = SplitsCreator.address;

  // Deploy FractionToken implementation and proxy
  console.log("Deploying FractionToken...");

  const { FractionToken, FractionTokenImplAddress, FractionTokenInitData } =
    await deployFractionToken("", 10000n, process.env.HATS_ADDRESS as Address);
  const fractionTokenAddress = FractionToken.address;

  // Deploy SplitsCreatorFactory implementation and proxy
  console.log("Deploying SplitsCreatorFactory...");

  const {
    SplitsCreatorFactory,
    SplitsCreatorFactoryImplAddress,
    SplitsCreatorFactoryInitData,
  } = await deploySplitsCreatorFactory(splitsCreatorAddress);
  const splitsCreatorFactoryAddress = SplitsCreatorFactory.address;

  // Deploy BigBang implementation and proxy
  console.log("Deploying BigBang...");

  const { BigBang, BigBangImplAddress, BigBangInitData } = await deployBigBang({
    hatsContractAddress: process.env.HATS_ADDRESS as Address,
    hatsModuleFacotryAddress: process.env
      .HATS_MODULE_FACTORY_ADDRESS as Address,
    hatsTimeFrameModule_impl: hatsTimeFrameModuleAddress,
    hatsHatCreatorModule_impl: hatsHatCreatorModuleAddress,
    splitsCreatorFactoryAddress: splitsCreatorFactoryAddress,
    splitsFactoryV2Address: process.env.PULL_SPLITS_FACTORY_ADDRESS as Address,
    fractionTokenAddress: fractionTokenAddress,
  });
  const bigBangAddress = BigBang.address;

  // Set bigbang address to splits creator factory
  const SplitsCreatorFactoryContract = await ethers.getContractAt(
    "SplitsCreatorFactory",
    splitsCreatorFactoryAddress,
  );
  await SplitsCreatorFactoryContract.setBigBang(bigBangAddress);

  console.log("Successfully deployed contracts!🎉");
  console.log("Verify contract with these commands...\n");

  console.log(
    "HatsTimeframeModule module:\n",
    `npx hardhat verify ${hatsTimeFrameModuleAddress} 1.0.0 0x0000000000000000000000000000000000000001 --network ${network.name}\n`,
  );
  console.log(
    "HatsHatCreatorModule module:\n",
    `npx hardhat verify ${hatsHatCreatorModuleAddress} 1.0.0 0x0000000000000000000000000000000000000001 --network ${network.name}\n`,
  );
  console.log(
    "FractionToken:\n",
    `npx hardhat verify ${FractionTokenImplAddress} --network ${network.name} &&`,
    `npx hardhat verify ${fractionTokenAddress} ${FractionTokenImplAddress} ${FractionTokenInitData} --network ${network.name}\n`,
  );
  console.log(
    "SplitsCreator:\n",
    `npx hardhat verify ${splitsCreatorAddress} --network ${network.name}\n`,
  );
  console.log(
    "SplitsCreatorFactory:\n",
    `npx hardhat verify ${SplitsCreatorFactoryImplAddress} --network ${network.name} &&`,
    `npx hardhat verify ${splitsCreatorFactoryAddress} ${SplitsCreatorFactoryImplAddress} ${SplitsCreatorFactoryInitData} --network ${network.name}\n`,
  );
  console.log(
    "BigBang:\n",
    `npx hardhat verify ${BigBangImplAddress} --network ${network.name} &&`,
    `npx hardhat verify ${bigBangAddress} ${BigBangImplAddress} ${BigBangInitData} --network ${network.name}`,
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
    name: "SplitsCreator",
    value: splitsCreatorAddress,
    network: network.name,
  });

  // Save upgradeable contracts implementations
  writeContractAddress({
    group: "implementations",
    name: "FractionToken_Implementation",
    value: FractionTokenImplAddress,
    network: network.name,
  });
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
    name: "FractionToken",
    value: fractionTokenAddress,
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
