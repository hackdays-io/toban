import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { type EntryContext, ServerRouter } from "react-router";
import { i18n, initI18n } from "./i18n";
import { detectServerLanguage } from "./i18n/detectServerLanguage";

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  return new Promise<Response>((resolve, reject) => {
    const userAgent = request.headers.get("user-agent");
    const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";

    const lng = detectServerLanguage(request);
    initI18n(lng);

    let didError = false;

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={i18n}>
        <ServerRouter context={routerContext} url={request.url} />
      </I18nextProvider>,
      {
        [callbackName]() {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;
          console.error(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
