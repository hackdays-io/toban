import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { type Plugin, defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
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

export default defineConfig({
  plugins: [
    ...clientNodePolyfills(),
    ignoreWellKnown(),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
