/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: "app/**/*.stories.{ts,tsx}",
  port: 6006,
  outDir: ".ladle/build",
  viteConfig: "vite.ladle.config.ts",
};
