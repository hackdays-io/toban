import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { ClientCacheProvider } from "./emotion/emotion-client";
import Routes from "./routes";

const hydrate = () => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("Root element not found! Falling back to document.body");
  }

  const mountPoint = rootElement || document.body;

  startTransition(() => {
    hydrateRoot(
      mountPoint,
      <StrictMode>
        <ClientCacheProvider>
          <Routes />
        </ClientCacheProvider>
      </StrictMode>,
    );
  });
};

if (typeof requestIdleCallback === "function") {
  requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  setTimeout(hydrate, 1);
}
