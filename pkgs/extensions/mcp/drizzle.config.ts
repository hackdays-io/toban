import type { Config } from "drizzle-kit";

/**
 * Drizzle config for the `@toban/mcp` package.
 *
 * The schema targets Cloudflare D1 (SQLite dialect). At runtime the Worker
 * passes its own D1 binding into `drizzle()`; this config is only used for
 * generating migrations locally via `pnpm --filter @toban/mcp drizzle:generate`.
 *
 * `@toban/mcp` owns exactly one table's worth of data (the token registry) —
 * it never writes to `@toban/identity`'s tables even though D1 is a shared
 * resource in practice (see CLAUDE.md).
 */
export default {
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
} satisfies Config;
