import { ethers, network } from "hardhat";
import type { Address } from "viem";
import { deployHatsQuestModule } from "../../helpers/deploy/Hats";
import {
  loadDeployedContractAddresses,
  writeContractAddress,
} from "../../helpers/deploy/contractsJsonHelper";

// Targeted swap of the HatsQuestModule implementation. After the metadata
// field changed from `bytes32 metadataHash` to `string metadataUri`, only the
// module impl bytecode changed — so we redeploy just that impl (new CREATE2
// address) and point the existing BigBang at it via setHatsQuestModuleImpl.
// BigBang / SplitsCreatorFactory / ThanksTokenFactory addresses are unchanged,
// so frontend env and subgraph config stay the same. Only workspaces created
// *after* this swap will deploy the new (string-metadata) quest module.
const swap = async () => {
  const [deployerSigner] = await ethers.getSigners();
  const deployerAddress = await deployerSigner.getAddress();
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployerAddress}`);

  const existing = loadDeployedContractAddresses(network.name);
  const bigBangAddress = existing.contracts.BigBang as Address;
  if (!bigBangAddress) throw new Error("BigBang address not found in outputs");
  console.log(`BigBang: ${bigBangAddress}`);

  // 1. Deploy the new HatsQuestModule implementation (CREATE2).
  const { HatsQuestModule } = await deployHatsQuestModule("0.0.0");
  const newImpl = HatsQuestModule.address;
  console.log(`New HatsQuestModule impl: ${newImpl}`);

  // 2. Point the existing BigBang at the new impl (onlyOwner).
  const BigBang = await ethers.getContractAt("BigBang", bigBangAddress);
  const owner = await BigBang.owner();
  console.log(`BigBang owner: ${owner}`);
  if (owner.toLowerCase() !== deployerAddress.toLowerCase()) {
    throw new Error(
      `Deployer ${deployerAddress} is not the BigBang owner (${owner}); cannot call setHatsQuestModuleImpl`,
    );
  }

  const before = await BigBang.HatsQuestModule_IMPL();
  console.log(`Current HatsQuestModule_IMPL: ${before}`);

  const tx = await BigBang.setHatsQuestModuleImpl(newImpl);
  console.log(`setHatsQuestModuleImpl tx: ${tx.hash}`);
  await tx.wait();

  const after = await BigBang.HatsQuestModule_IMPL();
  console.log(`Updated HatsQuestModule_IMPL: ${after}`);
  if (after.toLowerCase() !== newImpl.toLowerCase()) {
    throw new Error("HatsQuestModule_IMPL did not update as expected");
  }

  // 3. Record the new impl address.
  writeContractAddress({
    group: "contracts",
    name: "HatsQuestModule",
    value: newImpl,
    network: network.name,
  });

  console.log("HatsQuestModule impl swap complete 🎉");
  console.log(
    `Verify: pnpm contract hardhat verify ${newImpl} 0.0.0 --network ${network.name}`,
  );
};

swap();
