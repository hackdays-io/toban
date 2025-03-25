import { configureSynpressForMetaMask } from "@synthetixio/synpress/cypress";
import { defineConfig } from "cypress";

export default defineConfig({
  chromeWebSecurity: true,
  e2e: {
    baseUrl: "http://localhost:5173",
    testIsolation: false,
    async setupNodeEvents(on, config) {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      return configureSynpressForMetaMask(on, config) as any;
    },
  },
  userAgent: "synpress",
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
});
