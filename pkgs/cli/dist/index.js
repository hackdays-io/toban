#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const server_1 = require("./commands/server");
commander_1.program.addCommand(server_1.tobanProgram);
commander_1.program.parse(process.argv);
