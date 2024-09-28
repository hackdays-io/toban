#!/usr/bin/env node

import { program } from "commander";
import { tobanProgram } from "./commands/function";

program.addCommand(tobanProgram);

program.parse(process.argv);
