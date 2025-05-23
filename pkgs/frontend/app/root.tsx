import { ApolloProvider } from "@apollo/client/react";
import { Container } from "@chakra-ui/react";
import { withEmotionCache } from "@emotion/react";
import { PrivyProvider } from "@privy-io/react-auth";
import {
  type ClientLoaderFunctionArgs,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  data,
  useLoaderData,
} from "@remix-run/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { currentChain } from "hooks/useViem";
import { useEffect } from "react";
import { ToastContainer, toast as notify } from "react-toastify";
import toastStyles from "react-toastify/ReactToastify.css?url";
import { getToast } from "remix-toast";
import swiperStyles from "swiper/css?url";
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
        <title>Toban -当番-</title>
        <link rel="icon" href="/images/favicon.ico" />
      </head>
      <body>
        {children}

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
});

// Add stylesheets
export const links = () => [
  { rel: "stylesheet", href: toastStyles },
  { rel: "stylesheet", href: swiperStyles },
];
// Implemented from above
export const loader = async ({ request }: ClientLoaderFunctionArgs) => {
  const { toast, headers } = await getToast(request);
  return data({ toast }, { headers });
};

const queryClient = new QueryClient();

export default function App() {
  const {
    data: { toast },
  } = useLoaderData<typeof loader>();
  // Hook to show the toasts
  useEffect(() => {
    if (toast) {
      // notify on a toast message
      notify(toast.message, { type: toast.type });
    }
  }, [toast]);

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
            <ToastContainer />
          </ChakraProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </ApolloProvider>
  );
}
