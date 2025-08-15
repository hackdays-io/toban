import * as fs from "node:fs";
import * as path from "node:path";
import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { isAddress } from "viem";
import { loadDeployedContractAddresses } from "../../helpers/deploy/contractsJsonHelper";

interface BatchMintRecord {
  address: `0x${string}`;
  timestamp?: bigint;
}

/**
 * Parse CSV file and return batch mint records
 * Expected CSV format: address,timestamp (header required)
 */
function parseCsvFile(filePath: string): BatchMintRecord[] {
  const csvContent = fs.readFileSync(filePath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("CSV file must have a header and at least one data row");
  }

  const header = lines[0].split(",").map((col) => col.trim());
  const addressIndex = header.findIndex(
    (col) => col.toLowerCase() === "address",
  );
  const timestampIndex = header.findIndex(
    (col) => col.toLowerCase() === "timestamp",
  );

  if (addressIndex === -1) {
    throw new Error("CSV file must have an 'address' column");
  }

  const batchRecords: BatchMintRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(",").map((col) => col.trim());

    if (columns.length <= addressIndex) {
      continue; // Skip invalid rows
    }

    // Address validation
    const address = columns[addressIndex]?.toLowerCase();
    if (!address || !isAddress(address)) {
      throw new Error(
        `Invalid address at row ${i + 1}: ${columns[addressIndex]}`,
      );
    }

    // Timestamp parsing (optional)
    let timestamp: bigint | undefined;
    if (timestampIndex !== -1 && columns[timestampIndex]) {
      const timestampNum = Number(columns[timestampIndex]);
      if (Number.isNaN(timestampNum) || timestampNum < 0) {
        throw new Error(
          `Invalid timestamp at row ${i + 1}: ${columns[timestampIndex]}`,
        );
      }
      timestamp = BigInt(timestampNum);
    }

    batchRecords.push({
      address: address as `0x${string}`,
      timestamp,
    });
  }

  return batchRecords;
}

/**
 * 【Task】call batchMintHat of HatsTimeFrameModule
 * Usage:
 * - From CSV file: npx hardhat batchMintHat --hatid 123 --csv ./data/example-wearers.csv --network sepolia
 * - From addresses: npx hardhat batchMintHat --hatid 123 --addresses "0x123...,0x456..." --network sepolia
 */
task("batchMintHat", "Batch mint hats to multiple addresses")
  .addParam("hatid", "Hat ID to mint")
  .addOptionalParam(
    "csv",
    "Path to CSV file containing addresses and optional timestamps",
  )
  .addOptionalParam("addresses", "Comma-separated list of addresses")
  .addOptionalParam("batchsize", "Maximum batch size (default: 50)", "50")
  .addOptionalParam(
    "module",
    "HatsTimeFrameModule instance address (clone). If omitted, uses the address from outputs",
  )
  .setAction(
    async (
      taskArgs: {
        hatid: string;
        csv?: string;
        addresses?: string;
        batchsize: string;
        module?: `0x${string}`;
      },
      hre: HardhatRuntimeEnvironment,
    ) => {
      console.log(
        "################################### [START] batchMintHat ###################################",
      );

      const hatId = BigInt(taskArgs.hatid);
      const batchSize = Number.parseInt(taskArgs.batchsize);

      if (batchSize <= 0 || batchSize > 100) {
        throw new Error("Batch size must be between 1 and 100");
      }

      // Parse input data
      let batchRecords: BatchMintRecord[] = [];

      if (taskArgs.csv) {
        console.log(`Reading from CSV file: ${taskArgs.csv}`);
        const csvPath = path.resolve(taskArgs.csv);
        if (!fs.existsSync(csvPath)) {
          throw new Error(`CSV file not found: ${csvPath}`);
        }
        batchRecords = parseCsvFile(csvPath);
      } else if (taskArgs.addresses) {
        console.log("Processing addresses from command line");
        const addresses = taskArgs.addresses
          .split(",")
          .map((addr) => addr.trim());
        for (const address of addresses) {
          if (!isAddress(address)) {
            throw new Error(`Invalid address: ${address}`);
          }
          batchRecords.push({
            address: address as `0x${string}`,
          });
        }
      } else {
        throw new Error("Either --csv or --addresses parameter is required");
      }

      if (batchRecords.length === 0) {
        throw new Error("No valid addresses found");
      }

      console.log(`Total addresses to process: ${batchRecords.length}`);

      // Load contract
      const {
        contracts: { HatsTimeFrameModule },
      } = loadDeployedContractAddresses(hre.network.name);

      const moduleAddress = (taskArgs.module ||
        HatsTimeFrameModule) as `0x${string}`;
      const hatsTimeFrameModule = await hre.viem.getContractAt(
        "HatsTimeFrameModule",
        moduleAddress,
      );

      // Type assertion for new method that may not be in type definitions yet
      type ExtendedContract = typeof hatsTimeFrameModule & {
        write: typeof hatsTimeFrameModule.write & {
          batchMintHat: (
            args: [bigint, `0x${string}`[], bigint[]],
          ) => Promise<`0x${string}`>;
        };
      };
      const contractWithBatchMint = hatsTimeFrameModule as ExtendedContract;

      // Process in batches
      const totalBatches = Math.ceil(batchRecords.length / batchSize);
      console.log(
        `Processing in ${totalBatches} batch(es) of max ${batchSize} addresses each`,
      );

      for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, batchRecords.length);
        const batch = batchRecords.slice(startIndex, endIndex);

        console.log(
          `\n--- Batch ${i + 1}/${totalBatches} (${batch.length} addresses) ---`,
        );

        const wearers = batch.map((record) => record.address);
        const times = batch.map((record) => record.timestamp || 0n);

        try {
          console.log("Addresses:", wearers);
          console.log(
            "Timestamps:",
            times.map((t) => t.toString()),
          );

          const tx = await contractWithBatchMint.write.batchMintHat([
            hatId,
            wearers,
            times,
          ]);

          console.log(`✅ Batch ${i + 1} transaction: ${tx}`);
          console.log(`module: ${moduleAddress}`);

          // Wait for transaction confirmation
          const publicClient = await hre.viem.getPublicClient();
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: tx,
          });

          console.log(
            `✅ Batch ${i + 1} confirmed in block: ${receipt.blockNumber}`,
          );
        } catch (error) {
          console.error(`❌ Batch ${i + 1} failed:`, error);
          throw error;
        }
      }

      console.log(
        "\n################################### [END] batchMintHat ###################################",
      );
    },
  );
