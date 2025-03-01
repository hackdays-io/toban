import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "./components/chakra-provider";
import { ClientCacheProvider } from "./emotion/emotion-client";
import App from "./root";

const hydrate = () => {
  startTransition(() => {
    const root = document.getElementById("root");
    if (!root) throw new Error("Root element not found");

    hydrateRoot(
      root,
      <StrictMode>
        <BrowserRouter>
          <ClientCacheProvider>
            <ChakraProvider>
              <App />
            </ChakraProvider>
          </ClientCacheProvider>
        </BrowserRouter>
      </StrictMode>,
    );
  });
};

if (typeof requestIdleCallback === "function") {
  requestIdleCallback(hydrate);
} else {
  setTimeout(hydrate, 1);
}
