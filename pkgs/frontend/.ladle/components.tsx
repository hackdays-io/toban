import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/500.css";
import "@fontsource/noto-sans-jp/700.css";

import "../app/styles/globals.css";

import type { GlobalProvider } from "@ladle/react";

export const Provider: GlobalProvider = ({ children }) => (
  <div className="min-h-screen bg-bg p-6 text-text-primary">{children}</div>
);
