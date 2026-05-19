import { ethers, network } from "hardhat";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

const TX = process.env.TX_HASH;

const main = async () => {
  if (!TX) throw new Error("set TX_HASH env");
  const {
    contracts: { BigBang },
  } = loadDeployedContractAddresses(network.name);
  const receipt = await ethers.provider.getTransactionReceipt(TX);
  if (!receipt) throw new Error(`receipt not found for ${TX}`);

  const bigbang = await ethers.getContractAt("BigBang", BigBang);
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== BigBang.toLowerCase()) continue;
    try {
      const parsed = bigbang.interface.parseLog(log);
      if (!parsed) continue;
      console.log(`\n=== ${parsed.name} ===`);
      for (const input of parsed.fragment.inputs) {
        console.log(`  ${input.name}: ${parsed.args[input.name]}`);
      }
    } catch {}
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
