import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig({
  plugins: [
    envOnlyMacros(),
    tsconfigPaths(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
      ssr: true,
    }),
  ],
  server: {
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      external: [
        "remix-i18next/client",
        "remix-i18next",
        "remix-i18next/server",
      ],
    },
  },
});
