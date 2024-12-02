import { withEmotionCache } from "@emotion/react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
// import { ThemeProvider } from "next-themes";  // DarkMode 切り替えの実装の可能性に備え、ThemeProvider を残しておいてあります
import { ChakraProvider } from "./components/chakra-provider";
import { useInjectStyles } from "./emotion/emotion-client";
import { PrivyProvider } from "@privy-io/react-auth";
import { Box, Container } from "@chakra-ui/react";
import { Header } from "./components/Header";
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
        <Box bg="gray.50" minHeight="100vh" overflow="auto">
          <Container bg="white" maxW="sm" minH="100vh" px={4}>
            <Header />
            {children}
          </Container>
        </Box>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
});

export default function App() {
  return (
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
        <Outlet />
        {/* </ThemeProvider> */}
      </ChakraProvider>
    </PrivyProvider>
  );
}
