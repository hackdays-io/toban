#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const function_1 = require("./commands/function");
const hats_1 = require("./commands/hats");
commander_1.program.addCommand(function_1.functionCommands);
commander_1.program.addCommand(hats_1.hatsCommands);
commander_1.program.parse(process.argv);
