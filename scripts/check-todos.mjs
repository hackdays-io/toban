#!/usr/bin/env node
// Fails on a to-do / fix-me marker comment that does not name its issue
// (`TODO(#123)`, `FIXME #123`, or an `.../issues/123` URL). Deferred work
// is tracked in an issue, not in the code.
//
//   node scripts/check-todos.mjs            # every tracked source file
//   node scripts/check-todos.mjs a.ts b.sol # only these files
//
// Only comments are checked, never string literals or JSX text. JS/TS goes
// through the TypeScript parser, so regex literals and JSX cannot be mistaken
// for comments.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const JS_TS = /\.(c|m)?(j|t)sx?$/;
const SLASH_STAR = /\.(sol|css)$/; // `//` and `/* */`, no regex/template/JSX
const HASH = /\.(sh|ya?ml|toml|graphql)$/;
const DASH_DASH = /\.sql$/;

// Vendored upstream copies and generated output are not ours to rewrite.
export const EXCLUDED = [
  /(^|\/)node_modules\//,
  /(^|\/)(build|dist|artifacts|\.react-router)\//,
  /^pkgs\/frontend\/(gql|abi)\//,
  /^pkgs\/subgraph\/generated\//,
  /^pkgs\/contract\/typechain-types\//,
  /^pkgs\/contract\/contracts\/(hats|splits)\//,
  /^\.claude\/worktrees\//,
];

const MARKER = /\b(TODO|FIXME|XXX)\b/;
const MARKER_WITH_ISSUE = /\b(TODO|FIXME|XXX)(\(#\d+\)|:? #\d+\b)/;
const ISSUE_URL = /\/issues\/\d+/;

export function isTarget(path) {
  return (
    [JS_TS, SLASH_STAR, HASH, DASH_DASH].some((re) => re.test(path)) &&
    !EXCLUDED.some((re) => re.test(path))
  );
}

// Returns [{ line, text }] for every comment line (1-based line numbers).
export function extractComments(source, path) {
  if (JS_TS.test(path)) return tsComments(source, path);
  if (SLASH_STAR.test(path)) return slashStarComments(source);
  if (DASH_DASH.test(path)) return lineComments(source, "--", false);
  return lineComments(source, "#", /\.sh$/.test(path));
}

function splitLines(text, startLine) {
  return text.split("\n").map((t, k) => ({ line: startLine + k, text: t }));
}

function tsComments(source, path) {
  const kind = /x$/.test(path)
    ? ts.ScriptKind.TSX
    : /\.(c|m)?js$/.test(path)
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    false,
    kind,
  );
  const out = [];
  const seen = new Set();
  const collect = (ranges) => {
    for (const r of ranges ?? []) {
      if (seen.has(r.pos)) continue;
      seen.add(r.pos);
      const text = source.slice(r.pos, r.end).replace(/^\/[/*]|\*\/$/g, "");
      const { line } = sf.getLineAndCharacterOfPosition(r.pos);
      out.push(...splitLines(text, line + 1));
    }
  };
  // Every comment is trivia next to some token. JSX text is not trivia, but
  // the trivia scanner cannot tell, so never scan from where it begins.
  const jsxText = new Set();
  const walk = (node, fn) => {
    if (
      node.kind >= ts.SyntaxKind.FirstJSDocNode &&
      node.kind <= ts.SyntaxKind.LastJSDocNode
    ) {
      return;
    }
    fn(node);
    for (const child of node.getChildren(sf)) walk(child, fn);
  };
  walk(sf, (n) => n.kind === ts.SyntaxKind.JsxText && jsxText.add(n.pos));
  walk(sf, (n) => {
    if (!jsxText.has(n.pos)) {
      collect(ts.getLeadingCommentRanges(source, n.pos));
    }
    if (!jsxText.has(n.end)) {
      collect(ts.getTrailingCommentRanges(source, n.end));
    }
  });
  return out.sort((a, b) => a.line - b.line);
}

function slashStarComments(src) {
  const out = [];
  let line = 1;
  let quote = null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "\n") {
      line++;
      quote = null;
    } else if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      const stop = end === -1 ? src.length : end;
      out.push({ line, text: src.slice(i + 2, stop) });
      i = stop - 1;
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end;
      const body = src.slice(i + 2, stop);
      out.push(...splitLines(body, line));
      line += body.split("\n").length - 1;
      i = stop + 1;
    }
  }
  return out;
}

// `#` / `--` comments, outside quotes. In shell, `#` starts a comment only at
// a word boundary, and heredoc bodies are data.
function lineComments(src, marker, shell) {
  const out = [];
  let heredocEnd = null;
  src.split("\n").forEach((raw, idx) => {
    if (heredocEnd !== null) {
      if (raw.trim() === heredocEnd) heredocEnd = null;
      return;
    }
    if (idx === 0 && raw.startsWith("#!")) return;
    let quote = null;
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (quote) {
        if (c === "\\" && quote === '"') i++;
        else if (c === quote) quote = null;
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (
        raw.startsWith(marker, i) &&
        (!shell || i === 0 || /\s/.test(raw[i - 1]))
      ) {
        out.push({ line: idx + 1, text: raw.slice(i + marker.length) });
        break;
      }
    }
    const heredoc = shell && raw.match(/<<-?\s*(['"]?)(\w+)\1/);
    if (heredoc) heredocEnd = heredoc[2];
  });
  return out;
}

// Returns [{ line, text, reason }] for the offending comment lines.
export function findViolations(source, path) {
  const findings = [];
  for (const { line, text } of extractComments(source, path)) {
    const marker = text.match(MARKER);
    if (marker && !MARKER_WITH_ISSUE.test(text) && !ISSUE_URL.test(text)) {
      findings.push({
        line,
        text: text.trim(),
        reason: `${marker[0]} without an issue reference`,
      });
    }
  }
  return findings;
}

export function trackedFiles() {
  return execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean);
}

function main(args) {
  const files = (args.length > 0 ? args : trackedFiles()).filter(isTarget);
  let count = 0;
  for (const file of files) {
    let source;
    try {
      source = readFileSync(file, "utf8");
    } catch {
      continue; // deleted in the working tree
    }
    for (const f of findViolations(source, file)) {
      count++;
      console.log(`${file}:${f.line}: ${f.reason}: ${f.text}`);
    }
  }
  if (count > 0) {
    console.log(`
check-todos: ${count} marker comment(s) without an issue.
Do the work now, or open an issue and reference it: "TODO(#123): ...".
Don't explain a shortcut or its history in a comment instead (AGENTS.md).`);
    process.exit(1);
  }
  console.log(`check-todos: OK (${files.length} files)`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main(process.argv.slice(2));
}
