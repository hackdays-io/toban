#!/usr/bin/env node

import { program } from "commander";
import { tobanProgram } from "./commands/server";

program.addCommand(tobanProgram);

program.parse(process.argv);
