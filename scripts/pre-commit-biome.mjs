#!/usr/bin/env node
// Lefthook pre-commit: `biome check --write` on the staged files only.
//
// Biome 1.9 skips biome.json `files.ignore` for paths given on the command line
// (and for --staged), so generated code such as pkgs/frontend/gql would be
// rewritten. Drop ignored paths here first, using biome.json as the only list.
//
//   node scripts/pre-commit-biome.mjs <file>...

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const ignore =
  JSON.parse(readFileSync("biome.json", "utf8")).files?.ignore ?? [];

// A pattern like "**/build" names a directory, so test the file and every parent.
const isIgnored = (file) => {
  const parts = file.split("/");
  for (let i = 1; i <= parts.length; i++) {
    const p = parts.slice(0, i).join("/");
    if (ignore.some((g) => path.matchesGlob(p, g))) return true;
  }
  return false;
};

const files = process.argv.slice(2).filter((f) => !isIgnored(f));
if (files.length === 0) process.exit(0);

const { status, error } = spawnSync(
  "npx",
  [
    "biome",
    "check",
    "--write",
    "--no-errors-on-unmatched",
    "--files-ignore-unknown=true",
    ...files,
  ],
  { stdio: "inherit", shell: process.platform === "win32" },
);
if (error) console.error(`pre-commit-biome: ${error.message}`);
process.exit(status ?? 1);
