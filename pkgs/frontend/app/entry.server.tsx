import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";

import { createReadableStreamFromReadable } from "@remix-run/node";
import { isbot } from "isbot";
import { resolve } from "node:path";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";

import { createInstance } from "i18next";
import Backend from "i18next-fs-backend";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { i18nConfig } from "~/config/i18n.js";
import { remixI18Next } from "~/config/i18next.server.js";

const ABORT_DELAY = 5_000;

const handleRequest = async (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) => {
  const callbackName = isbot(request.headers.get("user-agent"))
    ? "onAllReady"
    : "onShellReady";

  // Internationalization (i18n).
  const i18nInstance = createInstance();
  const lng = await remixI18Next.getLocale(request);
  const ns = remixI18Next.getRouteNamespaces(remixContext);

  await i18nInstance
    .use(initReactI18next) // Tell our instance to use react-i18next.
    .use(Backend) // Setup backend.
    .init({
      ...i18nConfig, // Spread configuration.
      lng, // Locale detected above.
      ns, // Namespaces detected above.
      backend: { loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json") },
    });

  new Promise((resolve, reject) => {
    let shellRendered = false;

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18nInstance}>
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />
      </I18nextProvider>,
      {
        [callbackName]: () => {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.
          // Don't log errors encountered during initial shell rendering,
          // since they'll reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
};

export default handleRequest;
