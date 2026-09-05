#!/usr/bin/env tsx
/**
 * `pnpm openclaw render:config [--guilds <path>] [--template <path>] [--out <path>]`
 *
 * テンプレートとギルド一覧から `openclaw.json` を組み立てて書き出す。書き出すだけで、
 * Fly には送らない（送るのは `scripts/push-config.sh`）。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type GuildEntry,
  type JsonObject,
  RenderConfigError,
  renderConfig,
} from "../src/render-config.js";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = process.argv[i + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`--${name} に値がありません`);
  }
  return value;
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new Error(`${path} を読めません: ${(e as Error).message}`);
  }
}

/** 設定が参照している `${ENV_VAR}` を列挙する（fly secrets の設定漏れ確認用）。 */
function envRefs(config: JsonObject): string[] {
  const found = JSON.stringify(config).match(/\$\{([A-Z0-9_]+)\}/g) ?? [];
  return [...new Set(found.map((s) => s.slice(2, -1)))].sort();
}

function main(): void {
  const templatePath = resolve(
    pkgRoot,
    arg("template", "config/openclaw.template.json"),
  );
  const guildsPath = resolve(pkgRoot, arg("guilds", "config/guilds.json"));
  const outPath = resolve(pkgRoot, arg("out", "dist/openclaw.json"));

  const template = readJson(templatePath) as JsonObject;
  const guilds = readJson(guildsPath) as GuildEntry[];
  if (!Array.isArray(guilds)) {
    throw new Error(`${guildsPath} は配列である必要があります`);
  }

  const { config, agentIds } = renderConfig(template, guilds);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  console.log(`✓ ${outPath}`);
  console.log(
    `  ギルド ${guilds.length} / エージェント ${agentIds.join(", ")}`,
  );
  const refs = envRefs(config);
  if (refs.length > 0) {
    console.log(`  参照している環境変数: ${refs.join(", ")}`);
    console.log("  → fly secrets に入っていることを確認すること");
  }
}

try {
  main();
} catch (e) {
  if (e instanceof RenderConfigError) {
    console.error(`✗ 設定が不正です: ${e.message}`);
  } else {
    console.error(`✗ ${(e as Error).message}`);
  }
  process.exit(1);
}
