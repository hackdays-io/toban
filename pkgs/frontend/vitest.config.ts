import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Unit tests only — deliberately does not load the React Router / PWA /
// polyfill plugin stack from `vite.config.ts`, which exists to build the app,
// not to run node-side modules. Cypress still owns E2E.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["app/**/*.test.ts", "hooks/**/*.test.ts", "utils/**/*.test.ts"],
  },
});
