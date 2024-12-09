import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { createInstance } from "i18next";
import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { createEmotion } from "./emotion/emotion-server";
import i18n from "./i18n";
import i18next from "./i18next.server";

const handleRequest = async (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) => {
  const instance = createInstance();
  const lng = await i18next.getLocale(request);
  const ns = i18next.getRouteNamespaces(remixContext as any);

  await instance
    .use(initReactI18next) // Tell our instance to use react-i18next
    .use(Backend) // Setup our backend
    .init({
      ...i18n, // spread the configuration
      lng, // The locale we detected above
      ns, // The namespaces the routes about to render wants to use
      backend: { loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json") },
    });

  new Promise((resolve) => {
    const { renderToString, injectStyles } = createEmotion();

    const html = renderToString(
      <I18nextProvider i18n={instance}>
        <RemixServer context={remixContext} url={request.url} />
      </I18nextProvider>
    );

    responseHeaders.set("Content-Type", "text/html");

    const response = new Response(`<!DOCTYPE html>${injectStyles(html)}`, {
      status: responseStatusCode,
      headers: responseHeaders,
    });

    resolve(response);
  });
};

export default handleRequest;
