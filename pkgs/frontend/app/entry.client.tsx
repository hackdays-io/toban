import { RemixBrowser } from "@remix-run/react";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { ChakraProvider } from "./components/chakra-provider";
import { ClientCacheProvider } from "./emotion/emotion-client";

import { I18nextProvider, initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next";
import { i18nConfig } from "~/config/i18n.js";

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

const hydrate = async () => {
  await i18next
    // Use the react-i18next plugin.
    .use(initReactI18next)
    // Setup client-side language detector.
    .use(LanguageDetector)
    // Setup backend.
    .use(Backend)
    .init({
      // Spread configuration.
      ...i18nConfig,
      // Detects the namespaces your routes rendered while SSR use
      // and pass them here to load the translations.
      ns: getInitialNamespaces(),
      backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
      detection: {
        // We'll detect the language only server-side with remix-i18next.
        // By using `<html lang>` attribute we communicate to the Client.
        order: ["htmlTag"],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <ClientCacheProvider>
          <ChakraProvider>
            <I18nextProvider i18n={i18next}>
              <RemixBrowser />
            </I18nextProvider>
          </ChakraProvider>
        </ClientCacheProvider>
      </StrictMode>
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
