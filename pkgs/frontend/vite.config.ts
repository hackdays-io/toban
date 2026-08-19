import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { type Plugin, defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

const ssrBufferShim = fileURLToPath(
  new URL("./app/vite-polyfills/ssr-buffer.ts", import.meta.url),
);
const ssrProcessShim = fileURLToPath(
  new URL("./app/vite-polyfills/ssr-process.ts", import.meta.url),
);
const ssrGlobalShim = fileURLToPath(
  new URL("./app/vite-polyfills/ssr-global.ts", import.meta.url),
);

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

// Client polyfills inject `vite-plugin-node-polyfills/shims/*` imports (via
// esbuild banner / dep optimizer). Those paths are not resolvable from
// workspace packages during SSR — serve Node builtins instead.
const ssrShimsById: Record<string, string> = {
  "vite-plugin-node-polyfills/shims/buffer": ssrBufferShim,
  "vite-plugin-node-polyfills/shims/process": ssrProcessShim,
  "vite-plugin-node-polyfills/shims/global": ssrGlobalShim,
};

// Redirect the polyfill imports to Node-builtin-backed shims — but only in the
// SSR build. `resolveId` is gated by `applyToEnvironment` (a `config()` alias
// would not be), so the shim never leaks into the client/PWA build, where it
// would pull in `node:buffer` → `__vite-browser-external` (no `Buffer` export)
// and break the build.
const ssrPolyfillShims = (): Plugin => ({
  name: "ssr-polyfill-shims",
  enforce: "pre",
  applyToEnvironment(env) {
    return env.name === "ssr";
  },
  resolveId(id) {
    return ssrShimsById[id] ?? null;
  },
});

// Apply node polyfills only to the client bundle. SSR keeps native Node
// modules (avoids stream-browserify breaking `node:stream` etc).
const clientNodePolyfills = (): Plugin[] => {
  const result = nodePolyfills({
    include: ["buffer", "process"],
    // Inject Buffer/process/global only at build time. Dev-time banner injection
    // trips TDZ errors ("Cannot access '__buffer_polyfill' before initialization")
    // when React Router eagerly evaluates route modules in the bootstrap script.
    globals: { Buffer: "build", global: "build", process: "build" },
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

// Secrets the server needs but the browser must never see, so they carry no
// VITE_ prefix. Vite only surfaces VITE_* through `import.meta.env` and never
// populates `process.env` from .env files, so mirror them across for the dev
// server. In production the host (Vercel) injects them directly.
const SERVER_ONLY_ENV_KEYS = [
  "NAMESPACE_API_KEY",
  "NAMESPACE_MODE",
  "NAMESPACE_TIMEOUT_MS",
  "ENS_PARENT_NAME",
];

const loadServerOnlyEnv = (mode: string) => {
  const fileEnv = loadEnv(mode, process.cwd(), "");
  for (const key of SERVER_ONLY_ENV_KEYS) {
    if (process.env[key] === undefined && fileEnv[key] !== undefined) {
      process.env[key] = fileEnv[key];
    }
  }
};

export default defineConfig(({ mode }) => {
  loadServerOnlyEnv(mode);

  return {
    plugins: [
      ssrPolyfillShims(),
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
    // `@toban/identity` ships TypeScript source (no build step), so SSR must
    // transpile it rather than externalise it to Node's require.
    ssr: {
      noExternal: ["@toban/identity"],
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
  };
});
