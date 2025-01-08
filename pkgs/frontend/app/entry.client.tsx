import { RemixBrowser } from "@remix-run/react";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import Fetch from "i18next-fetch-backend";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next/client";
import { defaultNS, fallbackLng, supportedLngs } from "~/config/i18n";
import { ChakraProvider } from "./components/chakra-provider";
import { ClientCacheProvider } from "./emotion/emotion-client";

import i18next from "i18next";

const hydrate = async () => {
  await i18next
    .use(initReactI18next) // Tell i18next to use the react-i18next plugin
    .use(Fetch) // Tell i18next to use the Fetch backend
    .use(I18nextBrowserLanguageDetector) // Setup a client-side language detector
    .init({
      defaultNS,
      fallbackLng,
      supportedLngs,
      ns: getInitialNamespaces(),
      detection: {
        // Here only enable htmlTag detection, we'll detect the language only
        // server-side with remix-i18next, by using the `<html lang>` attribute
        // we can communicate to the client the language detected server-side
        order: ["htmlTag"],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
        caches: [],
      },
      backend: {
        // We will configure the backend to fetch the translations from the
        // resource route /api/locales and pass the lng and ns as search params
        loadPath: "/api/locales?lng={{lng}}&ns={{ns}}",
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

/*
if (typeof requestIdleCallback === "function") {
  requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  setTimeout(hydrate, 1);
}
*/

hydrate().catch((error) => console.error(error));
