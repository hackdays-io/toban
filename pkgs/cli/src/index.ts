#!/usr/bin/env node

import { Command } from "commander";
import type { PublicClient, WalletClient } from "viem";
import { bigbangCommands } from "./commands/bigbang";
import { fractionTokenCommands } from "./commands/fractionToken";
import { hatsCommands } from "./commands/hats";
import { pinataCommands } from "./commands/pinata";
import { splitsCommands } from "./commands/splits";
import { walletCommands } from "./commands/wallet";
import { skipPreActionCommands } from "./config";
import { getPublicClient } from "./modules/viem";
import { getWalletClient } from "./services/wallet";

export const rootProgram = new Command();

export let publicClient!: PublicClient;

export let walletClient!: WalletClient;

rootProgram
  .version("0.0.1")
  .option("--chain <chain>", "chain id", "11155111")
  .option("--profile <profile>", "Wallet profile")
  .hook("preAction", async (_, actionCommand) => {
    const { chain, profile } = rootProgram.opts();
    const parentName = actionCommand.parent?.name();
    const commandName = actionCommand.name();

    if (!skipPreActionCommands.includes(`${parentName}>${commandName}`)) {
      publicClient = await getPublicClient(chain);
      walletClient = await getWalletClient(profile, chain);
    }
  });

rootProgram.addCommand(bigbangCommands);
rootProgram.addCommand(hatsCommands);
rootProgram.addCommand(walletCommands);
rootProgram.addCommand(splitsCommands);
rootProgram.addCommand(pinataCommands);
rootProgram.addCommand(fractionTokenCommands);

rootProgram.parse(process.argv);
