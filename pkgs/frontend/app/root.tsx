import { withEmotionCache } from "@emotion/react";
import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
// import { ThemeProvider } from "next-themes";  // DarkMode 切り替えの実装の可能性に備え、ThemeProvider を残しておいてあります
import { Box, Container } from "@chakra-ui/react";
import { PrivyProvider } from "@privy-io/react-auth";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next/react";
import i18next from "~/i18next.server";
import { ChakraProvider } from "./components/chakra-provider";
import { Header } from "./components/Header";
import { useInjectStyles } from "./emotion/emotion-client";

interface LayoutProps extends React.PropsWithChildren {}

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18next.getLocale(request);
  return json({ locale });
}

export const handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
};

/**
 * Layout
 */
export const Layout = withEmotionCache((props: LayoutProps, cache) => {
  const { children } = props;
  // Get the locale from the loader
  const { locale } = useLoaderData<typeof loader>();
  const { i18n } = useTranslation();

  useInjectStyles(cache);
  useChangeLanguage(locale);

  return (
    <html lang={locale} dir={i18n.dir()}>
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
  );
}
