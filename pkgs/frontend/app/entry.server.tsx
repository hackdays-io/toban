import type { HandleDocumentRequestFunction } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { createEmotion } from "./emotion/emotion-server";

const handleRequest: HandleDocumentRequestFunction = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  remixContext: any,
) =>
  new Promise((resolve) => {
    const { renderToString, injectStyles } = createEmotion();

    const html = renderToString(
      <RemixServer context={remixContext} url={request.url} />,
    );

    responseHeaders.set("Content-Type", "text/html");

    const response = new Response(`<!DOCTYPE html>${injectStyles(html)}`, {
      status: responseStatusCode,
      headers: responseHeaders,
    });

    resolve(response);
  });

export default handleRequest;
