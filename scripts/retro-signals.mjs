#!/usr/bin/env node
// Extract the raw material for /retro from local Claude Code session
// transcripts of this repository (main checkout + its worktrees).
//
//   node scripts/retro-signals.mjs              # last 14 days, markdown
//   node scripts/retro-signals.mjs --days 30
//   node scripts/retro-signals.mjs --json
//
// Deliberately records only *structural facts* — never guesses meaning from
// words. Keyword matching ("違う", ...) mistakes a person's verbal
// habits for friction and misses politely worded corrections, so the meaning is
// judged later by /retro, in context and against that person's usual phrasing.
//
// For every message a person typed it records:
//   - what the agent said / was doing just before (context to judge it by)
//   - facts: sent mid-turn, followed an interrupt / a rejected tool call /
//     a hook block, restates an earlier message in the same session
//
// Output stays local: it contains what people typed. Summarize it; never paste
// it into a PR, issue or other external service.

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const days = Number(args[args.indexOf("--days") + 1]) || 14;
const asJson = args.includes("--json");
const since = Date.now() - days * 24 * 60 * 60 * 1000;

// Claude Code stores sessions under the cwd with "/" and "." replaced by "-".
const repoRoot = execSync(
  "git rev-parse --path-format=absolute --git-common-dir",
  {
    encoding: "utf8",
  },
)
  .trim()
  .replace(/\/\.git$/, "");
const encoded = repoRoot.replace(/[/.]/g, "-");
const projectsDir = path.join(os.homedir(), ".claude", "projects");
const dirs = fs.existsSync(projectsDir)
  ? fs
      .readdirSync(projectsDir)
      .filter((d) => d === encoded || d.startsWith(`${encoded}-`))
      .map((d) => path.join(projectsDir, d))
  : [];

const SYSTEM_TEXT =
  /^(<|Stop hook feedback|\[SYSTEM|Caveat:|Base directory for this skill)/;
const REJECTED = /doesn't want to proceed|tool use was rejected|user rejected/i;

const textOf = (content) =>
  typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n")
      : "";
// Judge only what the person typed, not text they pasted in.
const own = (t) =>
  t
    .replace(/<pasted_content[\s\S]*?<\/pasted_content[^>]*>/g, " [pasted] ")
    .trim();
const clip = (t, n) => {
  const one = t.replace(/\s+/g, " ").trim();
  return one.length > n ? `${one.slice(0, n)}…` : one;
};

const trigrams = (s) => {
  const t = s.replace(/\s+/g, "").toLowerCase();
  const out = new Set();
  for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3));
  return out;
};
const overlap = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / Math.min(a.size, b.size);
};

const sessions = [];
for (const dir of dirs) {
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"))) {
    const full = path.join(dir, file);
    if (fs.statSync(full).mtimeMs < since) continue;
    const s = {
      session: file.replace(/\.jsonl$/, ""),
      dir: path.basename(dir),
      title: "",
      branches: new Set(),
      messages: [],
      counts: { hookBlocks: 0, rejected: 0, interrupts: 0, toolErrors: 0 },
    };
    // Rolling context: the agent's latest words and actions, and pending facts
    // that attach to the next message the person types.
    let lastAgentText = "";
    let toolsSinceText = [];
    let pending = new Set();

    const pushMessage = (at, text, midTurn) => {
      const facts = [...pending];
      if (midTurn) facts.unshift("mid-turn");
      s.messages.push({
        at,
        text: own(text),
        facts,
        agentBefore: clip(lastAgentText, 280),
        agentToolsBefore: [...new Set(toolsSinceText)].slice(-5),
      });
      pending = new Set();
    };

    for (const line of fs.readFileSync(full, "utf8").split("\n")) {
      if (!line) continue;
      let e;
      try {
        e = JSON.parse(line);
      } catch {
        continue;
      }
      if (e.isSidechain) continue;
      if (e.gitBranch) s.branches.add(e.gitBranch);
      if (e.type === "ai-title" && e.aiTitle) s.title = e.aiTitle;

      if (e.type === "assistant" && Array.isArray(e.message?.content)) {
        for (const c of e.message.content) {
          if (c.type === "text" && c.text.trim()) {
            lastAgentText = c.text;
            toolsSinceText = [];
          } else if (c.type === "tool_use") {
            const target =
              c.input?.file_path ||
              c.input?.description ||
              c.input?.skill ||
              "";
            toolsSinceText.push(
              target ? `${c.name}(${clip(String(target), 60)})` : c.name,
            );
          }
        }
        continue;
      }
      if (e.type === "attachment") {
        const a = e.attachment || {};
        if (a.type === "hook_blocking_error") {
          s.counts.hookBlocks++;
          pending.add("after-hook-block");
        }
        if (
          a.type === "queued_command" &&
          typeof a.prompt === "string" &&
          !SYSTEM_TEXT.test(a.prompt)
        ) {
          pushMessage(e.timestamp, a.prompt, true);
        }
        continue;
      }
      if (e.type !== "user" || !e.message) continue;
      const content = e.message.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (c.type !== "tool_result") continue;
          const body =
            textOf(c.content) ||
            (typeof c.content === "string" ? c.content : "");
          if (REJECTED.test(body)) {
            s.counts.rejected++;
            pending.add("after-rejected-tool");
          } else if (c.is_error) s.counts.toolErrors++;
        }
      }
      const text = textOf(content).trim();
      if (!text) continue;
      if (/\[Request interrupted by user/.test(text)) {
        s.counts.interrupts++;
        pending.add("after-interrupt");
        continue;
      }
      if (SYSTEM_TEXT.test(text)) continue;
      pushMessage(e.timestamp, text, false);
    }
    if (s.messages.length === 0) continue;

    s.messages.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    const grams = s.messages.map((m) => trigrams(m.text));
    s.messages.forEach((m, i) => {
      for (let j = 0; j < i; j++) {
        if (grams[i].size > 8 && overlap(grams[i], grams[j]) >= 0.5) {
          m.facts.push(`restates#${j + 1}`);
          break;
        }
      }
    });
    s.branches = [...s.branches];
    sessions.push(s);
  }
}
sessions.sort((a, b) =>
  String(a.messages[0].at).localeCompare(String(b.messages[0].at)),
);

if (asJson) {
  console.log(JSON.stringify({ repoRoot, days, sessions }, null, 2));
  process.exit(0);
}

console.log(
  `# Session material — last ${days} days (${sessions.length} sessions)\n`,
);
console.log(
  "Facts only, no interpretation: mid-turn (typed while the agent was working), after-interrupt / after-rejected-tool / after-hook-block (what happened just before), restates#N (overlaps message N). `agent:` is what the agent said or did right before — judge each message in that context.\n",
);
for (const s of sessions) {
  const c = s.counts;
  console.log(`## ${s.title || s.session}`);
  console.log(
    `session ${s.session.slice(0, 8)} · ${s.dir} · branches: ${s.branches.join(", ") || "-"} · interrupts ${c.interrupts} · rejected tools ${c.rejected} · hook blocks ${c.hookBlocks} · tool errors ${c.toolErrors}\n`,
  );
  s.messages.forEach((m, i) => {
    const f = m.facts.length ? ` [${m.facts.join(", ")}]` : "";
    console.log(`${i + 1}. ${String(m.at).slice(0, 16)}${f}`);
    if (i > 0) {
      const tools = m.agentToolsBefore.length
        ? ` (then: ${m.agentToolsBefore.join(", ")})`
        : "";
      console.log(`   agent: ${m.agentBefore || "-"}${tools}`);
    }
    console.log(`   human: ${clip(m.text, i === 0 ? 200 : 300)}`);
  });
  console.log("");
}
