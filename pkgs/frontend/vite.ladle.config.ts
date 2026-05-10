import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Ladle uses its own internal Vite + React plugin, so we only add the project
// plugins that are needed inside stories. We deliberately omit the React
// Router plugin (which expects `app/root.tsx` as a route entry) and the node
// polyfills (stories don't touch wallet/web3 code).
export default defineConfig({
  plugins: [tailwindcss(), tsconfigPaths()],
});
