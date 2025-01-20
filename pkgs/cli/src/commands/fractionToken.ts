import { Command } from "commander";
import { mintFractionToken, sendFractionToken } from "../modules/fractiontoken";

export const fractionTokenCommands = new Command();

fractionTokenCommands
  .name("fractionToken")
  .description("This is a CLI fractionToken for toban project")
  .version("1.0.0");

fractionTokenCommands
  .command("mint")
  .description("Mint fraction token")
  .requiredOption("-hid, --hatId <hatId>", "Hat ID")
  .requiredOption("-a, --account <account>", "Account")
  .action(async (options) => {
    const transactionHash = await mintFractionToken(
      BigInt(options.hatId),
      options.account,
    );

    console.log(`Transaction hash: ${transactionHash}`);
  });

fractionTokenCommands
  .command("send")
  .description("Send fraction token")
  .requiredOption("-t, --to <to>", "To")
  .requiredOption("-hid, --hatId <hatId>", "Hat ID")
  .requiredOption("-a, --amount <amount>", "Amount")
  .action(async (options) => {
    const transactionHash = await sendFractionToken(
      options.to,
      BigInt(options.hatId),
      BigInt(options.amount),
    );

    console.log(`Transaction hash: ${transactionHash}`);
  });
