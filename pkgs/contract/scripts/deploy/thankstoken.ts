import type { Address } from "viem";
import { ethers, networkName } from "../../helpers/connection";
import {
  deployThanksToken,
  deployThanksTokenFactory,
} from "../../helpers/deploy/ThanksToken";

const deploy = async () => {
  console.log(
    "##################################### [Create2 Deploy START] #####################################",
  );

  const [deployerSigner] = await ethers.getSigners();
  const deployerAddress = await deployerSigner.getAddress();

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

  // Set bigbang address to thanks token factory
  const ThanksTokenFactoryContract = await ethers.getContractAt(
    "ThanksTokenFactory",
    thanksTokenFactoryAddress,
  );
  await ThanksTokenFactoryContract.setBigBang(
    "0xfB4FA9Dbb82a36566154A038e5f3865fbAC92422",
  );

  console.log("Successfully deployed contracts!🎉");
  console.log("Verify contract with these commands...\n");

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
    "\n##################################### [Create2 Deploy END] #####################################",
  );
};

deploy();
