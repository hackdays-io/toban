import { Command } from "commander";
import { zeroAddress } from "viem";
import { bigbang } from "../modules/bigbang";

export const bigbangCommands = new Command();

bigbangCommands
  .name("bigbang")
  .description("This is a CLI bigbang for toban project")
  .version("1.0.0");

bigbangCommands
  .command("create")
  .description("Create project")
  .requiredOption("-o, --owner <owner>", "Owner")
  .requiredOption("-td, --topHatDetails <topHatDetails>", "Top hat details")
  .requiredOption("-ti, --topHatImageURI <topHatImageURI>", "Top hat image URI")
  .option("-hd, --hatterHatDetails <hatterHatDetails>", "Hatter hat details")
  .option(
    "-hi, --hatterHatImageURI <hatterHatImageURI>",
    "Hatter hat image URI",
  )
  .option("-f, --trustedForwarder <trustedForwarder>", "Trusted forwarder")
  .action(async (options) => {
    const hash = await bigbang({
      owner: options.owner,
      topHatDetails: options.topHatDetails,
      topHatImageURI: options.topHatImageURI,
      hatterHatDetails: options.hatterHatDetails || "",
      hatterHatImageURI: options.hatterHatImageURI || "",
      trustedForwarder: options.trustedForwarder || zeroAddress,
    });

    console.log(`Transaction hash: ${hash}`);
  });
