import { ethers, network, upgrades } from "hardhat";
import type { Address } from "viem";
import {
  loadDeployedContractAddresses,
  writeContractAddress,
} from "../../helpers/deploy/contractsJsonHelper";

const deploy = async () => {
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

  // Get existing contract addresses
  const {
    contracts: { Hats, HatsModuleFactory, PullSplitsFactory },
  } = loadDeployedContractAddresses(network.name);

  // Setup Create2 Factory
  const factoryAbi = [
    "function deploy(uint256 amount, bytes32 salt, bytes calldata code) public returns (address)",
    "function computeAddress(bytes32 salt, bytes32 codeHash) public view returns (address)",
  ];
  const Create2Factory = await ethers.getContractAt(
    factoryAbi,
    "0x4e59b44847b379578588920cA78FbF26c0B4956C",
  );

  // Deploy ProxyAdmin with Create2
  const proxyAdminFactory = await ethers.getContractFactory("ProxyAdmin");
  const proxyAdminSalt = ethers.keccak256(
    ethers.concat([
      ethers.toUtf8Bytes("proxyAdmin"),
      ethers.keccak256(ethers.toUtf8Bytes("toban")),
    ]),
  );
  const proxyAdminBytecode = proxyAdminFactory.bytecode;
  const proxyAdminAddress = await Create2Factory.deploy(
    0,
    proxyAdminSalt,
    proxyAdminBytecode,
  );
  const proxyAdmin = await proxyAdminAddress.wait();
  console.log("ProxyAdmin deployed at:", proxyAdmin);

  // Generate unique salts for each contract
  const baseSalt = ethers.keccak256(ethers.toUtf8Bytes("toban"));
  const modulesSalt = ethers.keccak256(
    ethers.concat([ethers.toUtf8Bytes("modules"), baseSalt]),
  );
  const tokenSalt = ethers.keccak256(
    ethers.concat([ethers.toUtf8Bytes("token"), baseSalt]),
  );
  const splitsCreatorSalt = ethers.keccak256(
    ethers.concat([ethers.toUtf8Bytes("splitsCreator"), baseSalt]),
  );
  const splitsCreatorFactorySalt = ethers.keccak256(
    ethers.concat([ethers.toUtf8Bytes("splitsCreatorFactory"), baseSalt]),
  );
  const bigBangSalt = ethers.keccak256(
    ethers.concat([ethers.toUtf8Bytes("bigBang"), baseSalt]),
  );

  console.log("\nDeploying Contracts...");

  // Deploy HatsTimeFrameModule (non-upgradeable)
  const hatsTimeFrameModuleTx =
    await HatsTimeFrameModule.getDeployTransaction("1.0.0");
  const hatsTimeFrameModuleAddress = await Create2Factory.deploy(
    0,
    modulesSalt,
    hatsTimeFrameModuleTx.data || "0x",
  );
  const hatsTimeFrameModuleDeployed = await hatsTimeFrameModuleAddress.wait();
  console.log("HatsTimeFrameModule deployed at:", hatsTimeFrameModuleDeployed);

  // Deploy SplitsCreator (non-upgradeable)
  const splitsCreatorBytecode = SplitsCreator.bytecode;
  const splitsCreatorAddress = await Create2Factory.deploy(
    0,
    splitsCreatorSalt,
    splitsCreatorBytecode,
  );
  const splitsCreatorDeployed = await splitsCreatorAddress.wait();
  console.log("SplitsCreator deployed at:", splitsCreatorDeployed);

  // Deploy upgradeable contracts
  console.log("\nDeploying Implementation Contracts...");

  // Deploy FractionToken implementation and proxy
  const fractionTokenImplResult =
    await upgrades.deployImplementation(FractionToken);
  const fractionTokenImpl =
    typeof fractionTokenImplResult === "string"
      ? fractionTokenImplResult
      : fractionTokenImplResult.toString();
  console.log("FractionToken Implementation:", fractionTokenImpl);

  const TransparentUpgradeableProxy = await ethers.getContractFactory(
    "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy",
  );

  const fractionTokenInitData = FractionToken.interface.encodeFunctionData(
    "initialize",
    ["", 10000n, Hats as Address],
  );
  const fractionTokenProxyTx =
    await TransparentUpgradeableProxy.getDeployTransaction(
      fractionTokenImpl,
      proxyAdmin,
      fractionTokenInitData,
    );
  const fractionTokenAddress = await Create2Factory.deploy(
    0,
    tokenSalt,
    fractionTokenProxyTx.data || "0x",
  );
  const fractionTokenDeployed = await fractionTokenAddress.wait();
  console.log("FractionToken Proxy:", fractionTokenDeployed);

  // Deploy SplitsCreatorFactory implementation and proxy
  const splitsCreatorFactoryImplResult =
    await upgrades.deployImplementation(SplitsCreatorFactory);
  const splitsCreatorFactoryImpl =
    typeof splitsCreatorFactoryImplResult === "string"
      ? splitsCreatorFactoryImplResult
      : splitsCreatorFactoryImplResult.toString();
  console.log("SplitsCreatorFactory Implementation:", splitsCreatorFactoryImpl);

  const splitsCreatorFactoryInitData =
    SplitsCreatorFactory.interface.encodeFunctionData("initialize", [
      splitsCreatorDeployed,
    ]);
  const splitsCreatorFactoryProxyTx =
    await TransparentUpgradeableProxy.getDeployTransaction(
      splitsCreatorFactoryImpl,
      proxyAdmin,
      splitsCreatorFactoryInitData,
    );
  const splitsCreatorFactoryAddress = await Create2Factory.deploy(
    0,
    splitsCreatorFactorySalt,
    splitsCreatorFactoryProxyTx.data || "0x",
  );
  const splitsCreatorFactoryDeployed = await splitsCreatorFactoryAddress.wait();
  console.log("SplitsCreatorFactory Proxy:", splitsCreatorFactoryDeployed);

  // Deploy BigBang implementation and proxy
  const bigBangImplResult = await upgrades.deployImplementation(BigBang);
  const bigBangImpl =
    typeof bigBangImplResult === "string"
      ? bigBangImplResult
      : bigBangImplResult.toString();
  console.log("BigBang Implementation:", bigBangImpl);

  const bigBangInitData = BigBang.interface.encodeFunctionData("initialize", [
    {
      hatsContractAddress: Hats as Address,
      hatsModuleFacotryAddress: HatsModuleFactory as Address,
      hatsTimeFrameModule_impl: hatsTimeFrameModuleDeployed,
      splitsCreatorFactoryAddress: splitsCreatorFactoryDeployed,
      splitsFactoryV2Address: PullSplitsFactory as Address,
      fractionTokenAddress: fractionTokenDeployed,
    },
  ]);
  const bigBangProxyTx = await TransparentUpgradeableProxy.getDeployTransaction(
    bigBangImpl,
    proxyAdmin,
    bigBangInitData,
  );
  const bigBangAddress = await Create2Factory.deploy(
    0,
    bigBangSalt,
    bigBangProxyTx.data || "0x",
  );
  const bigBangDeployed = await bigBangAddress.wait();
  console.log("BigBang Proxy:", bigBangDeployed);

  // Save deployed addresses
  writeContractAddress({
    group: "contracts",
    name: "ProxyAdmin",
    value: proxyAdmin,
    network: network.name,
  });

  // Save non-upgradeable contracts
  writeContractAddress({
    group: "contracts",
    name: "HatsTimeFrameModule",
    value: hatsTimeFrameModuleDeployed,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "SplitsCreator",
    value: splitsCreatorDeployed,
    network: network.name,
  });

  // Save upgradeable contracts implementations
  writeContractAddress({
    group: "implementations",
    name: "FractionToken_Implementation",
    value: fractionTokenImpl,
    network: network.name,
  });
  writeContractAddress({
    group: "implementations",
    name: "SplitsCreatorFactory_Implementation",
    value: splitsCreatorFactoryImpl,
    network: network.name,
  });
  writeContractAddress({
    group: "implementations",
    name: "BigBang_Implementation",
    value: bigBangImpl,
    network: network.name,
  });

  // Save upgradeable contracts proxies
  writeContractAddress({
    group: "contracts",
    name: "FractionToken",
    value: fractionTokenDeployed,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "SplitsCreatorFactory",
    value: splitsCreatorFactoryDeployed,
    network: network.name,
  });
  writeContractAddress({
    group: "contracts",
    name: "BigBang",
    value: bigBangDeployed,
    network: network.name,
  });

  console.log(
    "##################################### [Create2 Deploy END] #####################################",
  );
};

deploy();
