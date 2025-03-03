import type { EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { createEmotion } from "./emotion/emotion-server";

const handleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
) =>
  new Promise((resolve) => {
    const { renderToString, injectStyles } = createEmotion();

    const html = renderToString(
      <ServerRouter context={reactRouterContext} url={request.url} />,
    );

    responseHeaders.set("Content-Type", "text/html");

    const response = new Response(`<!DOCTYPE html>${injectStyles(html)}`, {
      status: responseStatusCode,
      headers: responseHeaders,
    });

    resolve(response);
  });

export default handleRequest;
