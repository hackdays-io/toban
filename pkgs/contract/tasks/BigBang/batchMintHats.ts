import * as fs from "node:fs";
import * as path from "node:path";
import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

interface BatchMintHatsTaskArgs {
  csvfile?: string;
}

interface CsvRecord {
  hatId: string;
  wearer: string;
  time: string;
}

/**
 * Parse CSV file and extract hatId and wearer data
 */
function parseCSV(filePath: string): CsvRecord[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  // Skip header row
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    const [hatId, wearer, time] = line.split(",").map((field) => field.trim());
    return { hatId, wearer, time };
  });
}

/**
 * 【Task】execute batchMintHatsToWearers method
 */
task("batchMintHats", "Batch mint hats to specified wearers from CSV file")
  .addOptionalParam(
    "csvfile",
    "Path to CSV file (default: data/sample.csv)",
    "data/sample.csv",
  )
  .setAction(
    async (taskArgs: BatchMintHatsTaskArgs, hre: HardhatRuntimeEnvironment) => {
      console.log(
        "################################### [START] batch-mint-hats ###################################",
      );

      const [deployer] = await hre.viem.getWalletClients();

      // BigBangコントラクトのアドレスをjsonファイルから取得してくる。
      const {
        contracts: { BigBang },
      } = loadDeployedContractAddresses(hre.network.name);

      // create BigBang instance
      const bigbang = await hre.viem.getContractAt("BigBang", BigBang);

      // Read and parse CSV file
      const csvFilePath = path.resolve(taskArgs.csvfile || "data/sample.csv");
      console.log(`Reading CSV file: ${csvFilePath}`);

      if (!fs.existsSync(csvFilePath)) {
        throw new Error(`CSV file not found: ${csvFilePath}`);
      }

      const records = parseCSV(csvFilePath);

      if (records.length === 0) {
        throw new Error("No records found in CSV file");
      }

      // Extract hatIds and wearers from CSV records
      const hatIds = records.map((record) => BigInt(record.hatId));
      const wearerAddresses = records.map(
        (record) => record.wearer as `0x${string}`,
      );

      console.log(`Found ${records.length} records in CSV file`);
      console.log(`Hat IDs: ${hatIds.join(", ")}`);
      console.log(`Wearers: ${wearerAddresses.join(", ")}`);

      const address = deployer.account?.address;
      if (!address) {
        throw new Error("Wallet client account address is undefined");
      }

      try {
        // call batchMintHatsToWearers method
        const tx = await bigbang.write.batchMintHatsToWearers([
          hatIds,
          wearerAddresses,
        ]);

        console.log(`Transaction hash: ${tx}`);
        console.log("Batch mint hats completed successfully!");
      } catch (error) {
        console.error("Error executing batch mint hats:", error);
        throw error;
      }

      console.log(
        "################################### [END] batch-mint-hats ###################################",
      );
    },
  );
