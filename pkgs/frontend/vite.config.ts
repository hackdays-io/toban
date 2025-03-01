import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(), // React の Vite プラグイン
    tsconfigPaths(), // tsconfig.json のパスエイリアスを利用可能にする
  ],
  server: {
    port: 3000, // 必要に応じてポートを設定
  },
});
