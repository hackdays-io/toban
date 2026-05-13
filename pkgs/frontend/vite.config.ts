import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { type Plugin, defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

const ignoreWellKnown = (): Plugin => ({
  name: "ignore-well-known",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith("/.well-known/")) {
        res.statusCode = 404;
        res.end();
        return;
      }
      next();
    });
  },
});

// Apply node polyfills only to the client bundle. SSR keeps native Node
// modules (avoids stream-browserify breaking `node:stream` etc).
const clientNodePolyfills = (): Plugin[] => {
  const result = nodePolyfills({
    include: ["buffer", "process"],
    globals: { Buffer: true, global: true, process: true },
    protocolImports: false,
  });
  const list = (Array.isArray(result) ? result : [result]) as Plugin[];
  return list.map((p) => ({
    ...p,
    applyToEnvironment(env) {
      return env.name === "client";
    },
  }));
};

const pwa = (): Plugin[] =>
  VitePWA({
    registerType: "autoUpdate",
    injectRegister: false,
    manifest: {
      id: "/",
      name: "Toban",
      short_name: "Toban",
      description: "Toban -当番-",
      lang: "ja",
      dir: "ltr",
      theme_color: "#F5B82E",
      background_color: "#FAF7F0",
      display: "standalone",
      display_override: ["standalone", "minimal-ui"],
      start_url: "/",
      scope: "/",
      categories: ["productivity", "social"],
      icons: [
        {
          src: "/images/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/images/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/images/pwa-maskable-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      // Precache hashed static assets only. SSR means there is no static
      // index.html to fall back to, so navigations stay on the network.
      globPatterns: ["assets/**/*.{js,css,woff,woff2}"],
      globIgnores: ["**/server/**", "**/.vite/**"],
      // viem + permissionless + @privy-io get bundled into a single wallet
      // chunk that exceeds Workbox's 2 MiB default.
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      navigateFallback: null,
      runtimeCaching: [
        {
          urlPattern: ({ request, sameOrigin }) =>
            sameOrigin && request.destination === "image",
          handler: "CacheFirst",
          options: {
            cacheName: "toban-images",
            expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  }) as unknown as Plugin[];

export default defineConfig({
  plugins: [
    ...clientNodePolyfills(),
    ignoreWellKnown(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    ...pwa(),
  ],
  server: {
    allowedHosts: ["ubuntu", ".ts.net"],
    warmup: {
      clientFiles: [
        "./app/entry.client.tsx",
        "./app/root.tsx",
        "./app/routes/**/*.tsx",
      ],
    },
  },
  optimizeDeps: {
    include: [
      "@privy-io/react-auth",
      "react-i18next",
      "@apollo/client",
      "@tanstack/react-query",
      "axios",
      "viem",
      "viem/account-abstraction",
      "permissionless",
      "permissionless/accounts",
      "permissionless/clients/pimlico",
    ],
  },
});
