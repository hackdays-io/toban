import { flatRoutes } from "@react-router/fs-routes";
import type { RouteObject } from "react-router";

const routes = await flatRoutes({
  ignoredRouteFiles: [
    "**/.well-known/**",
    "**/.well-known.*",
    "**/.*", // Ignore all dotfiles
    "**/*.css",
    "**/*.test.{js,jsx,ts,tsx}",
    "**/__tests__/**",
  ],
});

export default routes as RouteObject[];
