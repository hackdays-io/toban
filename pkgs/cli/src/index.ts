#!/usr/bin/env node

import { program } from "commander";
import { functionCommands } from "./commands/function";
import { hatsCommands } from "./commands/hats";

program.addCommand(functionCommands);
program.addCommand(hatsCommands);

program.parse(process.argv);
