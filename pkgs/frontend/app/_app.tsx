import { ChakraProvider } from "@chakra-ui/react";
import chakraTheme from "../utils/chakra-theme"; // テーマをインポート

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={chakraTheme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
