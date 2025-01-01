import { withEmotionCache } from "@emotion/react";
import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
// import { ThemeProvider } from "next-themes";  // DarkMode 切り替えの実装の可能性に備え、ThemeProvider を残しておいてあります
import { ApolloProvider } from "@apollo/client/react";
import { Box, Container } from "@chakra-ui/react";
import { PrivyProvider } from "@privy-io/react-auth";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { goldskyClient } from "utils/apollo";
import { ChakraProvider } from "./components/chakra-provider";
import { Header } from "./components/Header";
import i18nServer, { localeCookie } from "./config/i18n.server";
import { useInjectStyles } from "./emotion/emotion-client";

interface LayoutProps extends React.PropsWithChildren {}

export const handle = { i18n: ["translation"] };

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18nServer.getLocale(request);
  return json(
    { locale },
    { headers: { "Set-Cookie": await localeCookie.serialize(locale) } }
  );
}

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
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          },
        }}
      >
        <ChakraProvider>
          {/* DarkMode 切り替えの実装の可能性に備え、ThemeProvider を残しておいてあります */}
          {/* <ThemeProvider disableTransitionOnChange attribute="class"> */}

          <Box
            bg="gray.50"
            width="100%"
            height="100vh"
            display="flex"
            justifyContent="center"
            overflow="auto"
          >
            <Container
              bg="#fffdf8"
              maxW="430px"
              height="100%"
              width="100%"
              px={5}
              py={4}
              display="flex"
              flexDirection="column"
              alignItems="center"
              position="relative"
            >
              <Header />
              <Box
                width="100%"
                height="100%"
                display="flex"
                flexDirection="column"
                position="relative"
              >
                <Outlet />
              </Box>
            </Container>
          </Box>
          {/* </ThemeProvider> */}
        </ChakraProvider>
      </PrivyProvider>
    </ApolloProvider>
  );
}
