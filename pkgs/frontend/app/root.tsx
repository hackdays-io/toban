import { ApolloProvider } from "@apollo/client/react";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { currentChain } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { useTranslation } from "react-i18next";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { ToastContainer } from "react-toastify";
import toastStyles from "react-toastify/ReactToastify.css?url";
import swiperStyles from "swiper/css?url";
import { goldskyClient } from "utils/apollo";
import { Header } from "./components/Header";
import { PWAUpdater } from "./components/PWAUpdater";
import { SmartWalletLoading } from "./components/SmartWalletLoading";
import { SwitchNetwork } from "./components/SwitchNetwork";
// Tailwind v4 + design tokens. Imported here so every route inherits them.
import "./styles/globals.css";

const THEME_COLOR = "#F5B82E";

interface LayoutProps extends React.PropsWithChildren {}

export const Layout = ({ children }: LayoutProps) => {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "ja";
  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>Toban -当番-</title>
        <link rel="icon" href="/images/favicon.ico" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content={THEME_COLOR} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Toban" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
      </head>
      <body className="bg-bg text-text-primary font-sans">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

// Add stylesheets
export const links = () => [
  { rel: "stylesheet", href: toastStyles },
  { rel: "stylesheet", href: swiperStyles },
];

const queryClient = new QueryClient();

const AppContent = () => {
  const { isConnectingEmbeddedWallet, isSmartWallet } = useActiveWallet();
  const isPreparingSmartWallet = isConnectingEmbeddedWallet && !isSmartWallet;

  return (
    <>
      <Header />
      {isPreparingSmartWallet ? <SmartWalletLoading /> : <Outlet />}
    </>
  );
};

export default function App() {
  return (
    <ApolloProvider client={goldskyClient}>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID}
        config={{
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
          externalWallets: {
            coinbaseWallet: {
              connectionOptions: "smartWalletOnly",
            },
          },
          supportedChains: [currentChain],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <SwitchNetwork />
          <PWAUpdater />
          {/* Phase 1-2 transitional shell: matches the current 430-px mobile
              frame. Phase 2-3 (#428) installs the real responsive AppShell. */}
          <div className="mx-auto min-h-screen w-full max-w-[430px] bg-surface">
            <AppContent />
          </div>
          <ToastContainer />
        </QueryClientProvider>
      </PrivyProvider>
    </ApolloProvider>
  );
}
