import type { Config } from "drizzle-kit";

/**
 * Drizzle config for the `@toban/identity` package.
 *
 * The schema targets Cloudflare D1 (SQLite dialect). At runtime each
 * consumer (e.g. `extensions/discord-bot` Worker) passes its own D1
 * binding into `drizzle()`; this config is only used for generating
 * migrations locally via `pnpm --filter @toban/identity drizzle:generate`.
 */
export default {
  dialect: "sqlite",
  schema: "./src/schema.ts",
  out: "./migrations",
} satisfies Config;
