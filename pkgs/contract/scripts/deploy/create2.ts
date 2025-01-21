import { ethers, network, upgrades } from "hardhat";
import type { Address } from "viem";
import { writeContractAddress } from "../../helpers/deploy/contractsJsonHelper";

// Setup Create2 Factory
const create2FactoryAbi = [
  "function deploy(uint256 amount, bytes32 salt, bytes calldata code) public returns (address)",
  "function computeAddress(bytes32 salt, bytes32 codeHash) public view returns (address)",
];

const create2FactoryAddress = "0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2";

const computeAddress = async (salt: string, hash: string) => {
  const create2Factory = await ethers.getContractAt(
    create2FactoryAbi,
    create2FactoryAddress,
  );
  const computedAddress = await create2Factory.computeAddress(salt, hash);
  return computedAddress;
};

const checkAlreadyDeployed = async (address: string) => {
  const code = await ethers.provider.getCode(address);
  return code !== "0x";
};

const deployContract = async (
  salt: string,
  code: string,
  hash: string,
  name: string,
) => {
  const computedAddress: string = await computeAddress(salt, hash);
  const alreadyDeployed = await checkAlreadyDeployed(computedAddress);
  if (alreadyDeployed) {
    console.log(`${name} already deployed at: ${computedAddress}`);
    return computedAddress;
  }
  const create2Factory = await ethers.getContractAt(
    create2FactoryAbi,
    create2FactoryAddress,
  );
  const tx = await create2Factory.deploy(0, salt, code);
  await tx.wait();

  console.log(`${name} deployed at: ${computedAddress}`);

  return computedAddress;
};

const deploy = async () => {
  const [deployer] = await ethers.getSigners();

  // Generate unique salts for each contract
  const baseSalt = ethers.keccak256(ethers.toUtf8Bytes("toban"));

  console.log(
    "##################################### [Create2 Deploy START] #####################################",
  );

  // Get contract factories
  const HatsTimeFrameModule = await ethers.getContractFactory(
    "HatsTimeFrameModule",
  );
  const FractionToken = await ethers.getContractFactory("FractionToken");
  const SplitsCreator = await ethers.getContractFactory("SplitsCreator");
  const SplitsCreatorFactory = await ethers.getContractFactory(
    "SplitsCreatorFactory",
  );
  const BigBang = await ethers.getContractFactory("BigBang");

  // Deploy ProxyAdmin with Create2
  const proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin");
  const proxyAdminBytecode = await proxyAdminFactory.getDeployTransaction(
    deployer.address,
  );

  const proxyAdminAddress = await deployContract(
    baseSalt,
    proxyAdminBytecode.data || "0x",
    ethers.keccak256(proxyAdminBytecode.data),
    "ProxyAdmin",
  );

  // Deploy HatsTimeFrameModule (non-upgradeable)
  const hatsTimeFrameModuleTx =
    await HatsTimeFrameModule.getDeployTransaction("1.0.0");
  const hatsTimeFrameModuleAddress = await deployContract(
    baseSalt,
    hatsTimeFrameModuleTx.data || "0x",
    ethers.keccak256(hatsTimeFrameModuleTx.data),
    "HatsTimeFrameModule",
  );

  // Deploy SplitsCreator (non-upgradeable)
  const splitsCreatorTx = await SplitsCreator.getDeployTransaction();
  const splitsCreatorAddress = await deployContract(
    baseSalt,
    splitsCreatorTx.data || "0x",
    ethers.keccak256(splitsCreatorTx.data),
    "SplitsCreator",
  );

  // Deploy FractionToken implementation and proxy
  console.log("Deploying FractionToken...");

  const fractionTokenImplTx = await FractionToken.getDeployTransaction();
  const fractionTokenImplAddress = await deployContract(
    baseSalt,
    fractionTokenImplTx.data || "0x",
    ethers.keccak256(fractionTokenImplTx.data),
    "FractionToken_Implementation",
  );

  const TransparentUpgradeableProxy = await ethers.getContractFactory(
    "TransparentUpgradeableProxy",
  );

  const fractionTokenInitData = FractionToken.interface.encodeFunctionData(
    "initialize",
    ["", 10000n, process.env.HATS_ADDRESS as Address],
  );

  const fractionTokenProxyTx =
    await TransparentUpgradeableProxy.getDeployTransaction(
      fractionTokenImplAddress,
      proxyAdminAddress,
      fractionTokenInitData,
    );

  const fractionTokenAddress = await deployContract(
    baseSalt,
    fractionTokenProxyTx.data || "0x",
    ethers.keccak256(fractionTokenProxyTx.data),
    "FractionToken",
  );

  // Deploy SplitsCreatorFactory implementation and proxy
  console.log("Deploying SplitsCreatorFactory...");

  const splitsCreatorFactoryImplTx =
    await SplitsCreatorFactory.getDeployTransaction();
  const splitsCreatorFactoryImplAddress = await deployContract(
    baseSalt,
    splitsCreatorFactoryImplTx.data || "0x",
    ethers.keccak256(splitsCreatorFactoryImplTx.data),
    "SplitsCreatorFactory_Implementation",
  );

  const splitsCreatorFactoryInitData =
    SplitsCreatorFactory.interface.encodeFunctionData("initialize", [
      deployer.address,
      splitsCreatorAddress,
    ]);
  const splitsCreatorFactoryProxyTx =
    await TransparentUpgradeableProxy.getDeployTransaction(
      splitsCreatorFactoryImplAddress,
      proxyAdminAddress,
      splitsCreatorFactoryInitData,
    );
  const splitsCreatorFactoryAddress = await deployContract(
    baseSalt,
    splitsCreatorFactoryProxyTx.data || "0x",
    ethers.keccak256(splitsCreatorFactoryProxyTx.data),
    "SplitsCreatorFactory",
  );

  // Deploy BigBang implementation and proxy
  console.log("Deploying BigBang...");

  const bigBangImplTx = await BigBang.getDeployTransaction();
  const bigBangImplAddress = await deployContract(
    baseSalt,
    bigBangImplTx.data || "0x",
    ethers.keccak256(bigBangImplTx.data),
    "BigBang_Implementation",
  );

  const bigBangInitData = BigBang.interface.encodeFunctionData("initialize", [
    deployer.address,
    process.env.HATS_ADDRESS as Address,
    process.env.HATS_MODULE_FACTORY_ADDRESS as Address,
    hatsTimeFrameModuleAddress,
    splitsCreatorFactoryAddress,
    process.env.PULL_SPLITS_FACTORY_ADDRESS as Address,
    fractionTokenAddress,
  ]);
  const bigBangProxyTx = await TransparentUpgradeableProxy.getDeployTransaction(
    bigBangImplAddress,
    proxyAdminAddress,
    bigBangInitData,
  );
  const bigBangAddress = await deployContract(
    baseSalt,
    bigBangProxyTx.data || "0x",
    ethers.keccak256(bigBangProxyTx.data),
    "BigBang",
  );

  // Set bigbang address to splits creator factory
  const SplitsCreatorFactoryContract = await ethers.getContractAt(
    "SplitsCreatorFactory",
    splitsCreatorFactoryAddress,
  );
  await SplitsCreatorFactoryContract.setBigBang(bigBangAddress);

  console.log("Successfully deployed contracts!🎉");
  console.log("Verify contract with these commands...\n");

  console.log(
    "1. First verify the ProxyAdmin contract.\n",
    `npx hardhat verify ${proxyAdminAddress} ${deployer.address} --network ${network.name} \n`,
  );

  console.log("2. Then verify other contracts.");
  console.log(
    "HatsTimeframeModule module:\n",
    `npx hardhat verify ${hatsTimeFrameModuleAddress} 1.0.0 --network ${network.name}\n`,
  );
  console.log(
    "FractionToken:\n",
    `npx hardhat verify ${fractionTokenImplAddress} --network ${network.name} &&`,
    `npx hardhat verify ${fractionTokenAddress} ${fractionTokenImplAddress} ${proxyAdminAddress} ${fractionTokenInitData} --network ${network.name}\n`,
  );
  console.log(
    "SplitsCreator:\n",
    `npx hardhat verify ${splitsCreatorAddress} --network ${network.name}\n`,
  );
  console.log(
    "SplitsCreatorFactory:\n",
    `npx hardhat verify ${splitsCreatorFactoryImplAddress} --network ${network.name} &&`,
    `npx hardhat verify ${splitsCreatorFactoryAddress} ${splitsCreatorFactoryImplAddress} ${proxyAdminAddress} ${splitsCreatorFactoryInitData} --network ${network.name}\n`,
  );
  console.log(
    "BigBang:\n",
    `npx hardhat verify ${bigBangImplAddress} --network ${network.name} &&`,
    `npx hardhat verify ${bigBangAddress} ${bigBangImplAddress} ${proxyAdminAddress} ${bigBangInitData} --network ${network.name}`,
  );

  // Save deployed addresses
  writeContractAddress({
    group: "contracts",
    name: "ProxyAdmin",
    value: proxyAdminAddress,
    network: network.name,
  });

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
    value: fractionTokenImplAddress,
    network: network.name,
  });
  writeContractAddress({
    group: "implementations",
    name: "SplitsCreatorFactory_Implementation",
    value: splitsCreatorFactoryImplAddress,
    network: network.name,
  });
  writeContractAddress({
    group: "implementations",
    name: "BigBang_Implementation",
    value: bigBangImplAddress,
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
