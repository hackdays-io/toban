import NameStone, { AuthenticationError, NetworkError } from "namestone-sdk";
import type { NameData } from "namestone-sdk";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

// Load environment variables from .env or .env.local file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendDir = resolve(__dirname, "../");

const rootEnvPath = resolve(frontendDir, ".env");
const localEnvPath = resolve(frontendDir, ".env.local");

console.log("Script directory:", __dirname);
console.log("Frontend directory:", frontendDir);
console.log("Looking for .env at:", rootEnvPath);
console.log("Looking for .env.local at:", localEnvPath);
console.log(".env exists:", existsSync(rootEnvPath));
console.log(".env.local exists:", existsSync(localEnvPath));

if (existsSync(localEnvPath)) {
  config({ path: localEnvPath });
  console.log("Loaded environment from .env.local");
} else if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
  console.log("Loaded environment from .env");
} else {
  console.warn(
    "No .env or .env.local file found. Make sure NAMESTONE_API_KEY is set in your environment.",
  );
}

// After loading, check if the variables are actually set
console.log(
  "VITE_NAMESTONE_API_KEY set:",
  !!process.env.VITE_NAMESTONE_API_KEY,
);
console.log("NAMESTONE_API_KEY set:", !!process.env.NAMESTONE_API_KEY);

// Initialize the NameStone instance with the API key from environment variables
const apiKey =
  process.env.VITE_NAMESTONE_API_KEY || process.env.NAMESTONE_API_KEY;
if (!apiKey) {
  console.error("Error: NAMESTONE_API_KEY environment variable is not set");
  process.exit(1);
}

const ns = new NameStone(apiKey);

// Define the query parameters
const domain = "toban.eth";
const limit = 100; // Increase the limit per page (assuming the API supports this)
const maxTotal = 200; // Maximum number of names to retrieve in total

// Use an immediately invoked async function to allow top-level await
(async () => {
  try {
    let allNames: NameData[] = [];
    let offset = 0;
    let hasMore = true;

    // Fetch names in batches until we reach the maximum or there are no more results
    while (hasMore && allNames.length < maxTotal) {
      console.log(`Fetching names with offset ${offset} and limit ${limit}...`);
      const response: NameData[] = await ns.getNames({
        domain: domain,
        limit: limit,
        offset: offset,
      });

      if (response.length > 0) {
        allNames = [...allNames, ...response];
        offset += response.length;
        console.log(`Retrieved ${response.length} names in this batch.`);

        // If we got fewer results than the limit, we've reached the end
        if (response.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    if (allNames.length > 0) {
      console.log(`Found ${allNames.length} name(s) in total:`);
      allNames.forEach((nameData, index) => {
        console.log(`\nName ${index + 1}:`);
        console.log(JSON.stringify(nameData, null, 2));
      });
    } else {
      console.log("No names found for the specified domain and address.");
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error("Authentication failed:", error.message);
    } else if (error instanceof NetworkError) {
      console.error("Network error:", error.message);
    } else {
      console.error("An unexpected error occurred:", error);
    }
  }
})();
