#!/usr/bin/env node

import { program } from "commander";
import { tobanProgram } from "./commands/function";
import { walletProgram } from "./commands/wallet";

program.addCommand(tobanProgram);
program.addCommand(walletProgram);

program.parse(process.argv);
