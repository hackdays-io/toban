import assert from "node:assert/strict";
import { test } from "node:test";
import { findViolations, isTarget } from "./check-todos.mjs";

const lines = (src, path = "a.ts") =>
  findViolations(src, path).map((f) => f.line);

test("TODO / FIXME / XXX need their issue next to them", () => {
  assert.deepEqual(lines("// TODO: do it later\nf();\n"), [1]);
  assert.deepEqual(lines("// FIXME broken\nf();\n"), [1]);
  assert.deepEqual(lines("// XXX odd\nf();\n"), [1]);
  assert.deepEqual(lines("// TODO use #123 color\nf();\n"), [1]);
  assert.deepEqual(lines("// TODO(#616): do it\nf();\n"), []);
  assert.deepEqual(lines("// FIXME #616 do it\nf();\n"), []);
  assert.deepEqual(
    lines("// TODO: see https://github.com/o/r/issues/12\nf();\n"),
    [],
  );
});

test("does not flag words that merely contain a marker", () => {
  assert.deepEqual(lines("// keep the todos list sorted\nf();\n"), []);
});

test("the TypeScript path finds every kind of comment", () => {
  const src = [
    "/** doc TODO */",
    "export function f(a: number /* TODO */) {",
    "  // TODO",
    "  return a; // TODO",
    "}",
    "// TODO",
  ].join("\n");
  assert.deepEqual(lines(src), [1, 2, 3, 4, 6]);
});

test("ignores markers inside string literals", () => {
  assert.deepEqual(lines('const s = "TODO";\n'), []);
  assert.deepEqual(lines("const s = `${a} // TODO`;\n"), []);
  assert.deepEqual(lines('const u = "https://example.com/TODO";\n'), []);
});

test("resumes scanning code after a template interpolation", () => {
  assert.deepEqual(lines("const s = `${f({ a: 1 })}`; // TODO\n"), [1]);
});

test("regex literals neither hide comments nor start fake ones", () => {
  assert.deepEqual(lines("const r = /`/;\nfoo();\n// TODO\n"), [3]);
  assert.deepEqual(lines('s.replace(/"/g, "1"); // TODO\n'), [1]);
  assert.deepEqual(lines("const r = /https?:\\/\\//; TODO(1);\n"), []);
});

test("JSX text is not a comment, and does not hide later comments", () => {
  const tsx = (src) => lines(src, "a.tsx");
  assert.deepEqual(tsx("const a = <p>Don't</p>;\n// TODO\n"), [2]);
  assert.deepEqual(tsx("const a = <p>use `x</p>;\nf();\n// TODO\n"), [3]);
  assert.deepEqual(tsx("const a = <p>see http://x TODO</p>;\n"), []);
  assert.deepEqual(tsx("const a = <p>{x} // TODO</p>;\n"), []);
  assert.deepEqual(tsx("const a = <p>Don't {/* TODO */}</p>;\n"), [1]);
});

test("Solidity and CSS use // and /* */", () => {
  assert.deepEqual(lines('string s = "// TODO";\n// TODO\n', "a.sol"), [2]);
  assert.deepEqual(lines("a { color: red; } /* TODO */\n", "a.css"), [1]);
});

test("shell, YAML, TOML and SQL comments, outside quotes and heredocs", () => {
  assert.deepEqual(lines("#!/bin/sh\necho hi # TODO\n", "x.sh"), [2]);
  assert.deepEqual(lines('echo "a#b"\necho "see # TODO"\n', "x.sh"), []);
  assert.deepEqual(lines("echo ${#x} $#\n", "x.sh"), []);
  assert.deepEqual(lines("cat <<'EOF'\n# TODO\nEOF\n# TODO\n", "x.sh"), [4]);
  assert.deepEqual(lines('run: echo "a # TODO"\n# TODO\n', "x.yml"), [2]);
  assert.deepEqual(lines('name = "x" # TODO\n', "wrangler.toml"), [1]);
  assert.deepEqual(lines("SELECT '--x'; -- TODO\n", "0001.sql"), [1]);
});

test("vendored and generated paths are excluded", () => {
  assert.equal(isTarget("pkgs/frontend/app/root.tsx"), true);
  assert.equal(isTarget("scripts/verify.sh"), true);
  assert.equal(isTarget("pkgs/extensions/mcp/src/abi/x.ts"), true);
  assert.equal(isTarget("pkgs/contract/contracts/hats/src/Hats.sol"), false);
  assert.equal(isTarget("pkgs/contract/contracts/splits/a.sol"), false);
  assert.equal(isTarget("pkgs/frontend/gql/graphql.ts"), false);
  assert.equal(isTarget("pkgs/frontend/abi/bigbang.ts"), false);
  assert.equal(isTarget("pkgs/subgraph/generated/schema.ts"), false);
  assert.equal(isTarget("pkgs/contract/typechain-types/x.ts"), false);
  assert.equal(isTarget("README.md"), false);
});
