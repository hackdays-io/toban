import { ApolloProvider } from "@apollo/client/react";
import { Container } from "@chakra-ui/react";
import { withEmotionCache } from "@emotion/react";
import { PrivyProvider } from "@privy-io/react-auth";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { currentChain } from "hooks/useViem";
import { goldskyClient } from "utils/apollo";
import { Header } from "./components/Header";
import { SwitchNetwork } from "./components/SwitchNetwork";
import { ChakraProvider } from "./components/chakra-provider";
import { useInjectStyles } from "./emotion/emotion-client";

interface LayoutProps extends React.PropsWithChildren {}

export const Layout = withEmotionCache((props: LayoutProps, cache) => {
  const { children } = props;

  useInjectStyles(cache);

  return (
    <html lang="en">
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <meta
          name="emotion-insertion-point"
          content="emotion-insertion-point"
        />
      </head>
      <body>
        {children}

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
});

export default function App() {
  return (
    <ApolloProvider client={goldskyClient}>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID}
        config={{
          appearance: {
            walletList: ["coinbase_wallet"],
          },
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
        <SwitchNetwork />
        <ChakraProvider>
          <Container
            bg="#fffdf8"
            maxW="430px"
            height="100%"
            width="100%"
            minH="100vh"
          >
            <Header />
            <Outlet />
          </Container>
        </ChakraProvider>
      </PrivyProvider>
    </ApolloProvider>
  );
}
