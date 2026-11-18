import assert from "node:assert/strict";
import { test } from "node:test";
import { findViolations, isTarget } from "./check-comments.mjs";

const lines = (src, path = "a.ts") =>
  findViolations(src, path).map((f) => f.line);

test("flags stopgap wording in line and block comments", () => {
  assert.deepEqual(lines("const a = 1; // hack around the cache\n"), [1]);
  assert.deepEqual(
    lines("/**\n * Workaround for the indexer\n */\nf();\n"),
    [2],
  );
  assert.deepEqual(lines("// 暫定対応\n// とりあえずこれで\nf();\n"), [1, 2]);
  assert.deepEqual(lines("x();\n// temporarily disabled\n"), [2]);
});

test("the TypeScript path finds every kind of comment", () => {
  const src = [
    "/** doc hack */",
    "export function f(a: number /* hack */) {",
    "  // hack",
    "  return a; // hack",
    "}",
    "// hack",
  ].join("\n");
  assert.deepEqual(lines(src), [1, 2, 3, 4, 6]);
});

test("ignores the same words inside string literals", () => {
  assert.deepEqual(lines('const s = "a temporary hack";\n'), []);
  assert.deepEqual(lines("const s = 'とりあえず';\n"), []);
  assert.deepEqual(lines("const s = `${a} hack // not a comment`;\n"), []);
  assert.deepEqual(lines('const u = "https://example.com/hack";\n'), []);
});

test("resumes scanning code after a template interpolation", () => {
  const src = "const s = `${f({ a: 1 })}`; // workaround\n";
  assert.deepEqual(lines(src), [1]);
});

test("regex literals neither hide comments nor start fake ones", () => {
  assert.deepEqual(lines("const r = /`/;\nfoo();\n// hack\n"), [3]);
  assert.deepEqual(lines('s.replace(/"/g, "1"); // hack\n'), [1]);
  assert.deepEqual(lines("const r = /https?:\\/\\//; hack(1);\n"), []);
});

test("JSX text is not a comment, and does not hide later comments", () => {
  const tsx = (src) => lines(src, "a.tsx");
  assert.deepEqual(tsx("const a = <p>Don't</p>;\n// hack\n"), [2]);
  assert.deepEqual(tsx("const a = <p>use `x</p>;\nf();\n// hack\n"), [3]);
  assert.deepEqual(tsx("const a = <p>see http://x for now</p>;\n"), []);
  assert.deepEqual(tsx("const a = <p>{x} // for now</p>;\n"), []);
  assert.deepEqual(tsx("const a = <p>Don't {/* hack */}</p>;\n"), [1]);
});

test("Solidity and CSS use // and /* */", () => {
  assert.deepEqual(lines('string s = "// hack";\n// hack\n', "a.sol"), [2]);
  assert.deepEqual(lines("a { color: red; } /* for now */\n", "a.css"), [1]);
});

test("TODO / FIXME need their issue next to them", () => {
  assert.deepEqual(lines("// TODO: do it later\nf();\n"), [1]);
  assert.deepEqual(lines("// FIXME broken\nf();\n"), [1]);
  assert.deepEqual(lines("// TODO use #123 color\nf();\n"), [1]);
  assert.deepEqual(lines("// TODO(#616): do it\nf();\n"), []);
  assert.deepEqual(lines("// FIXME #616 do it\nf();\n"), []);
  assert.deepEqual(
    lines("// TODO: see https://github.com/o/r/issues/12\nf();\n"),
    [],
  );
});

test("does not flag ordinary words that merely contain a term", () => {
  assert.deepEqual(lines("// shackle the hackathon todos\nf();\n"), []);
});

test("shell, YAML, TOML and SQL comments, outside quotes and heredocs", () => {
  assert.deepEqual(lines("#!/bin/sh\necho hi # hack\n", "x.sh"), [2]);
  assert.deepEqual(lines('echo "a#b"\necho "see # hack"\n', "x.sh"), []);
  assert.deepEqual(lines("echo ${#x} $#\n", "x.sh"), []);
  assert.deepEqual(
    lines("cat <<'EOF'\n# temporary\nEOF\n# hack\n", "x.sh"),
    [4],
  );
  assert.deepEqual(lines('run: echo "a # hack"\n# hack\n', "x.yml"), [2]);
  assert.deepEqual(lines('name = "x" # for now\n', "wrangler.toml"), [1]);
  assert.deepEqual(lines("SELECT '--x'; -- hack\n", "0001.sql"), [1]);
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
