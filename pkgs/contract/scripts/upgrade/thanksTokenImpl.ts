/**
 * ThanksToken implementation swap.
 *
 * ThanksToken is a Clone template (EIP-1167 minimal-proxy) — instances
 * are not individually upgradeable. To roll out new ThanksToken bytecode
 * we deploy a fresh implementation contract and point the (upgradeable)
 * ThanksTokenFactory at it via `setImplementation`. Existing clones keep
 * their old code; only NEW clones (from subsequent BigBang executions)
 * pick up the new bytecode.
 *
 * Run after editing `contracts/thankstoken/ThanksToken.sol`:
 *   pnpm contract compile
 *   pnpm contract upgrade:ThanksTokenImpl --network sepolia
 */
import * as dotenv from "dotenv";
import { ethers, network } from "hardhat";
import type { Address } from "viem";
import { deployThanksToken } from "../../helpers/deploy/ThanksToken";
import {
  loadDeployedContractAddresses,
  writeContractAddress,
} from "../../helpers/deploy/contractsJsonHelper";

dotenv.config();

const main = async () => {
  console.log(
    "##################################### [ThanksToken Impl Swap START] #####################################",
  );

  const {
    contracts: { ThanksTokenFactory: ThanksTokenFactoryAddress },
  } = loadDeployedContractAddresses(network.name);

  if (!ThanksTokenFactoryAddress) {
    throw new Error(
      `ThanksTokenFactory not found in outputs/contracts-${network.name}.json — run deploy:all first.`,
    );
  }

  console.log("Deploying new ThanksToken implementation...");
  const { ThanksTokenImplAddress } = await deployThanksToken();
  console.log("→ new impl:", ThanksTokenImplAddress);

  const factory = await ethers.getContractAt(
    "ThanksTokenFactory",
    ThanksTokenFactoryAddress,
  );
  const owner = await factory.owner();
  const [signer] = await ethers.getSigners();
  const signerAddr = await signer.getAddress();

  if (owner.toLowerCase() !== signerAddr.toLowerCase()) {
    throw new Error(
      `Signer ${signerAddr} is not the factory owner (${owner}). Cannot setImplementation.`,
    );
  }

  const oldImpl: string = await factory.IMPLEMENTATION();
  console.log("Current factory.IMPLEMENTATION:", oldImpl);

  if (oldImpl.toLowerCase() === ThanksTokenImplAddress.toLowerCase()) {
    console.log("No-op: factory already points to this implementation.");
  } else {
    console.log(
      `Calling factory.setImplementation(${ThanksTokenImplAddress})...`,
    );
    const tx = await factory.setImplementation(ThanksTokenImplAddress);
    console.log("tx:", tx.hash);
    await tx.wait();
    const newImpl: string = await factory.IMPLEMENTATION();
    console.log("Factory now points to:", newImpl);
  }

  writeContractAddress({
    group: "contracts",
    name: "ThanksToken_Implementation",
    value: ThanksTokenImplAddress as Address,
    network: network.name,
  });

  console.log(
    `\nVerify on Etherscan:\n  pnpm contract hardhat verify ${ThanksTokenImplAddress} --network ${network.name}`,
  );

  console.log(
    "##################################### [ThanksToken Impl Swap END] #####################################",
  );
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
