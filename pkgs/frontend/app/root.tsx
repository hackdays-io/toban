import { ApolloProvider } from "@apollo/client/react";
import { Suspense, lazy, useEffect, useState } from "react";
import { Links, Meta, Scripts, ScrollRestoration } from "react-router";
import toastStyles from "react-toastify/ReactToastify.css?url";
import swiperStyles from "swiper/css?url";
import { goldskyClient } from "utils/apollo";
// Self-host the brand fonts (Issue #426). Inter carries Latin numerals/labels
// and Noto Sans JP covers Japanese copy — both are referenced by --font-sans.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-sans-jp/500.css";
import "@fontsource/noto-sans-jp/700.css";

// Tailwind v4 + design tokens. Imported here so every route inherits them.
import "./styles/globals.css";

const THEME_COLOR = "#F5B82E";

// Privy SDK pulls in styled-components, which injects <style data-styled> into
// <head> on module evaluation. That tag is absent from the SSR HTML, so loading
// Privy at module level breaks hydration. Defer the entire Privy tree behind a
// dynamic import so the SSR HTML and the first client render both contain
// nothing from this subtree; Privy mounts after hydration completes.
const PrivyAppRoot = lazy(() => import("./components/PrivyAppRoot"));

export function Layout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning on <html>/<body>: browser extensions (wallet
  // injectors, dark-mode tools, password managers, translators) commonly
  // mutate these elements before React hydrates, causing dev-time warnings.
  // React falls back to client rendering silently in production either way;
  // this just keeps the dev console quiet for the inevitable extension
  // interference on a Privy/wallet-heavy app.
  //
  // <head> contains ONLY `<Meta />` + `<Links />`. Hardcoding `<meta>` /
  // `<link>` here interleaves them with Vite's dev critical-CSS injection
  // and React's hydration comparison fails ("Expected server HTML to
  // contain a matching <meta> in <head>") on direct loads of heavier routes.
  // All static head content lives in the `meta` / `links` exports below so
  // React Router controls the order deterministically — see commit dfd24c0.
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <Meta />
        <Links />
      </head>
      <body
        className="bg-bg text-text-primary font-sans"
        suppressHydrationWarning
      >
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const meta = () => [
  { charSet: "utf-8" },
  { name: "viewport", content: "width=device-width, initial-scale=1" },
  { title: "Toban -当番-" },
  { name: "theme-color", content: THEME_COLOR },
  { name: "apple-mobile-web-app-capable", content: "yes" },
  { name: "apple-mobile-web-app-status-bar-style", content: "default" },
  { name: "apple-mobile-web-app-title", content: "Toban" },
];

export const links = () => [
  { rel: "icon", href: "/images/favicon.ico" },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "apple-touch-icon", href: "/images/apple-touch-icon.png" },
  { rel: "stylesheet", href: toastStyles },
  { rel: "stylesheet", href: swiperStyles },
];

export default function App() {
  // Wait until after hydration to mount the lazy boundary. Mounting it during
  // hydration would let the dynamic import resolve mid-flight and trip
  // React's "Suspense boundary received an update before it finished
  // hydrating" warning. useEffect runs only on the client and only after
  // hydration completes, so by the time we render PrivyAppRoot the tree is
  // safely past the SSR comparison.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <ApolloProvider client={goldskyClient}>
      {hydrated ? (
        <Suspense fallback={null}>
          <PrivyAppRoot />
        </Suspense>
      ) : null}
    </ApolloProvider>
  );
}
