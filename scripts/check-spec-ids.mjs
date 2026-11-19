#!/usr/bin/env node
// Checks that protocol principle IDs (e.g. SPL-1) agree across:
//   - the Principles tables in pkgs/document/docs/protocol/**/*.md
//       | `SPL-1` | text | proven (Lean) | fuzzed, tested |
//   - Lean theorems in pkgs/spec: a `-- SPL-1: ...` line directly above `theorem`
//   - contract tests in pkgs/contract/test: `[SPL-1]` in a test/describe name.
//     Files named *Differential* count as `fuzzed`, others as `tested`.
//
// The status a page declares must match what exists: `proven (Lean)` needs a
// theorem, `fuzzed` / `tested` need a test of that kind, and a theorem or
// test tag with an ID the page does not declare (or declares as missing) fails.
// Run by scripts/verify.sh on every change; see pkgs/spec/AGENTS.md.
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { trackedFiles } from "./check-todos.mjs";

const ID = "[A-Z]{2,5}-\\d+";
const NONE = new Set(["", "—", "-", "none"]);

/** Principles table rows → Map(id → { proof, impl:Set, where }) */
export function parseDocs(files, errors) {
  const ids = new Map();
  const row = new RegExp(
    `^\\|\\s*\`(${ID})\`\\s*\\|.*\\|\\s*([^|]*?)\\s*\\|\\s*([^|]*?)\\s*\\|\\s*$`,
  );
  for (const [file, text] of files) {
    text.split("\n").forEach((line, i) => {
      const m = line.match(row);
      if (!m) return;
      const [, id, proof, impl] = m;
      const where = `${file}:${i + 1}`;
      if (ids.has(id)) {
        errors.push(
          `${where}: ${id} is declared twice (also ${ids.get(id).where})`,
        );
        return;
      }
      if (!NONE.has(proof) && proof !== "proven (Lean)") {
        errors.push(
          `${where}: ${id} proof status must be "proven (Lean)" or "—", got "${proof}"`,
        );
      }
      const implSet = new Set(
        impl
          .split(",")
          .map((s) => s.trim())
          .filter((s) => !NONE.has(s)),
      );
      for (const s of implSet) {
        if (s !== "fuzzed" && s !== "tested") {
          errors.push(
            `${where}: ${id} implementation status must be fuzzed / tested / —, got "${s}"`,
          );
        }
      }
      ids.set(id, { proven: proof === "proven (Lean)", impl: implSet, where });
    });
  }
  return ids;
}

/** `-- SPL-1` directly above a theorem → Map(id → where) */
export function parseLean(files, errors) {
  const ids = new Map();
  const tag = new RegExp(`^\\s*--\\s*(${ID})\\b`);
  for (const [file, text] of files) {
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      const m = line.match(tag);
      if (!m) return;
      const where = `${file}:${i + 1}`;
      let j = i + 1;
      while (j < lines.length && /^\s*(--|$)/.test(lines[j])) j++;
      if (!/^\s*theorem\s/.test(lines[j] ?? "")) {
        errors.push(`${where}: ${m[1]} tag is not directly above a theorem`);
        return;
      }
      if (ids.has(m[1])) {
        errors.push(
          `${where}: ${m[1]} tags two theorems (also ${ids.get(m[1])})`,
        );
        return;
      }
      ids.set(m[1], where);
    });
  }
  return ids;
}

/** `[SPL-1]` in test files → Map(id → { fuzzed:[], tested:[] }) */
export function parseTests(files) {
  const ids = new Map();
  const tag = new RegExp(`\\[(${ID})\\]`, "g");
  // Only the title (first string argument) of it(...) / describe(...) counts,
  // not comments or other strings in the file.
  const title =
    /\b(?:it|describe)(?:\.only|\.skip)?\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
  for (const [file, text] of files) {
    const kind = /differential/i.test(basename(file)) ? "fuzzed" : "tested";
    const titles = [...text.matchAll(title)].map((t) => t[2]).join("\n");
    for (const m of titles.matchAll(tag)) {
      if (!ids.has(m[1])) ids.set(m[1], { fuzzed: [], tested: [] });
      const list = ids.get(m[1])[kind];
      if (!list.includes(file)) list.push(file);
    }
  }
  return ids;
}

export function check({ docs, lean, tests }) {
  const errors = [];
  const declared = parseDocs(docs, errors);
  const theorems = parseLean(lean, errors);
  const tagged = parseTests(tests);

  for (const [id, d] of declared) {
    if (d.proven && !theorems.has(id)) {
      errors.push(
        `${d.where}: ${id} says "proven (Lean)" but no Lean theorem is tagged "-- ${id}"`,
      );
    }
    if (!d.proven && theorems.has(id)) {
      errors.push(
        `${d.where}: ${id} has a Lean theorem (${theorems.get(id)}); mark it "proven (Lean)"`,
      );
    }
    for (const kind of ["fuzzed", "tested"]) {
      const found = tagged.get(id)?.[kind] ?? [];
      if (d.impl.has(kind) && found.length === 0) {
        errors.push(
          `${d.where}: ${id} says "${kind}" but no ${kind === "fuzzed" ? "*Differential*" : "non-differential"} test is tagged [${id}]`,
        );
      }
      if (!d.impl.has(kind) && found.length > 0) {
        errors.push(
          `${d.where}: ${id} is ${kind} by ${found.join(", ")}; add "${kind}" to its status`,
        );
      }
    }
  }
  for (const [id, where] of theorems) {
    if (!declared.has(id))
      errors.push(
        `${where}: Lean theorem tagged ${id}, which no protocol page declares`,
      );
  }
  // Tags like [EIP-712] in a title are not principles: only prefixes a
  // protocol page uses (SPL, ...) are checked.
  const prefixes = new Set([...declared.keys()].map((id) => id.split("-")[0]));
  for (const [id, t] of tagged) {
    if (prefixes.has(id.split("-")[0]) && !declared.has(id)) {
      errors.push(
        `${[...t.fuzzed, ...t.tested].join(", ")}: test tagged [${id}], which no protocol page declares`,
      );
    }
  }
  return { errors, count: declared.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.chdir(fileURLToPath(new URL("..", import.meta.url)));
  const files = trackedFiles();
  const load = (dir, ext) =>
    files
      .filter((f) => f.startsWith(`${dir}/`) && f.endsWith(ext))
      .flatMap((f) => {
        try {
          return [[f, readFileSync(f, "utf8")]];
        } catch {
          return []; // deleted in the working tree
        }
      });
  const { errors, count } = check({
    docs: load("pkgs/document/docs/protocol", ".md"),
    lean: load("pkgs/spec", ".lean"),
    tests: load("pkgs/contract/test", ".ts"),
  });
  if (errors.length > 0) {
    for (const e of errors) console.error(`spec-ids: ${e}`);
    process.exit(1);
  }
  console.log(
    `spec-ids: ${count} principle IDs agree across docs, Lean and tests`,
  );
}
