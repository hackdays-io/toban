import assert from "node:assert/strict";
import { test } from "node:test";
import { check } from "./check-spec-ids.mjs";

const page = (rows) => [
  [
    "docs/x.md",
    `| ID | Principle | Proof | Implementation |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n`,
  ],
];
const lean = (ids) => [
  [
    "Spec/T.lean",
    ids
      .map(
        (id) =>
          `-- ${id}: text\ntheorem t_${id.replace("-", "_")} : True := trivial\n`,
      )
      .join("\n"),
  ],
];
const diff = (ids) => [
  "test/X.Differential.ts",
  `describe("${ids.map((i) => `[${i}]`).join("")} d", () => {});`,
];
const unit = (ids) => [
  "test/X.ts",
  `it("${ids.map((i) => `[${i}]`).join("")} u", async () => {});`,
];

test("passes when docs, Lean and tests agree", () => {
  const r = check({
    docs: page([
      "| `SPL-1` | sum | proven (Lean) | fuzzed, tested |",
      "| `SPL-2` | b | — | — |",
    ]),
    lean: lean(["SPL-1"]),
    tests: [diff(["SPL-1"]), unit(["SPL-1"])],
  });
  assert.deepEqual(r.errors, []);
  assert.equal(r.count, 2);
});

test("fails when a proven principle has no theorem", () => {
  const r = check({
    docs: page(["| `SPL-1` | s | proven (Lean) | — |"]),
    lean: [],
    tests: [],
  });
  assert.match(r.errors.join("\n"), /no Lean theorem/);
});

test("fails when a theorem exists but the page does not say proven", () => {
  const r = check({
    docs: page(["| `SPL-1` | s | — | — |"]),
    lean: lean(["SPL-1"]),
    tests: [],
  });
  assert.match(r.errors.join("\n"), /mark it "proven \(Lean\)"/);
});

test("fails when fuzzed / tested is claimed without that kind of test", () => {
  const r = check({
    docs: page(["| `SPL-1` | s | — | fuzzed, tested |"]),
    lean: [],
    tests: [unit(["SPL-1"])],
  });
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0], /says "fuzzed"/);
});

test("fails when a test is tagged but the status omits it", () => {
  const r = check({
    docs: page(["| `SPL-1` | s | — | fuzzed |"]),
    lean: [],
    tests: [diff(["SPL-1"]), unit(["SPL-1"])],
  });
  assert.match(r.errors.join("\n"), /add "tested"/);
});

test("counts tags only in it/describe titles, not comments or other strings", () => {
  const r = check({
    docs: page(["| `SPL-1` | s | — | — |"]),
    lean: [],
    tests: [
      [
        "test/X.ts",
        '// see [SPL-1]\nconst s = "[SPL-1]";\nit("[EIP-712] signs", async () => {});',
      ],
    ],
  });
  assert.deepEqual(r.errors, []);
});

test("fails on IDs no page declares", () => {
  const r = check({
    docs: page(["| `SPL-1` | s | — | — |"]),
    lean: lean(["SPL-9"]),
    tests: [unit(["SPL-8"])],
  });
  assert.equal(r.errors.length, 2);
});

test("fails on a tag that is not above a theorem, duplicates and bad statuses", () => {
  const r = check({
    docs: page([
      "| `SPL-1` | s | maybe | fuzzy |",
      "| `SPL-1` | again | — | — |",
    ]),
    lean: [["Spec/T.lean", "-- SPL-1: text\ndef notATheorem := 1\n"]],
    tests: [],
  });
  const all = r.errors.join("\n");
  assert.match(all, /declared twice/);
  assert.match(all, /proof status/);
  assert.match(all, /implementation status/);
  assert.match(all, /not directly above a theorem/);
});
