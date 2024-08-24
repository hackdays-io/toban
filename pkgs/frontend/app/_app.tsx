import { ChakraProvider } from "@chakra-ui/react";
import chakraTheme from "../utils/chakra-theme"; // パスは適宜調整してください

function MyApp({ Component, pageProps }) {
  return (
    <ChakraProvider theme={chakraTheme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
