import { ApolloProvider } from "@apollo/client/react";
import { Container } from "@chakra-ui/react";
import { withEmotionCache } from "@emotion/react";
import { PrivyProvider } from "@privy-io/react-auth";
import { currentChain } from "hooks/useViem";
import { useEffect } from "react";
import { Links, Meta, useLoaderData } from "react-router";
import {
  Outlet as OutletRouterDom,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ToastContainer, toast as notify } from "react-toastify";
import toastStyles from "react-toastify/ReactToastify.css?url";
import { getToast } from "remix-toast";
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
        <div id="root">{children}</div>
        <Scripts />
        <ScrollRestoration />
      </body>
    </html>
  );
});

// Add the toast stylesheet
export const links = () => [{ rel: "stylesheet", href: toastStyles }];
// Implemented from above
// export const loader = async ({ request }: ClientLoaderFunctionArgs) => {
//   const { toast, headers } = await getToast(request);
//   return data({ toast }, { headers });
// };

export default function App() {
  // useLoaderDataの部分は一時的にコメントアウトまたは固定値に置き換え
  // const {
  //   data: { toast },
  // } = useLoaderData();
  // const toast = null; // 一時的に無効化

  // Hook to show the toasts
  // useEffect(() => {
  //   if (toast) {
  //     // notify on a toast message
  //     notify(toast.message, { type: toast.type });
  //   }
  // }, [toast]);

  return (
    <ApolloProvider client={goldskyClient}>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID}
        config={{
          appearance: {
            walletList: ["coinbase_wallet", "metamask"],
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
            <OutletRouterDom />
          </Container>
          {/* <ToastContainer /> */}
        </ChakraProvider>
      </PrivyProvider>
    </ApolloProvider>
  );
}
