#!/usr/bin/env node

import { program } from "commander";
import { functionCommands } from "./commands/function";
import { walletProgram } from "./commands/wallet";
import { hatsCommands } from "./commands/hats";

program.addCommand(functionCommands);
program.addCommand(hatsCommands);
program.addCommand(walletProgram);

program.parse(process.argv);
