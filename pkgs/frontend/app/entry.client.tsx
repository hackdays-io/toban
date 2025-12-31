import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router-dom";
import { ChakraProvider } from "./components/chakra-provider";
import { ClientCacheProvider } from "./emotion/emotion-client";

const hydrate = () => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <ClientCacheProvider>
          <ChakraProvider>
            <HydratedRouter />
          </ChakraProvider>
        </ClientCacheProvider>
      </StrictMode>,
    );
  });
};

if (typeof requestIdleCallback === "function") {
  requestIdleCallback(hydrate);
} else {
  setTimeout(hydrate, 1);
}
