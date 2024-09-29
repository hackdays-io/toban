#!/usr/bin/env node

import { program } from "commander";
import { functionCommands } from "./commands/function";
import { hatsCommands } from "./commands/hats";
import { walletCommands } from "./commands/wallet";

program.addCommand(functionCommands);
program.addCommand(hatsCommands);
program.addCommand(walletCommands);

program.parse(process.argv);
