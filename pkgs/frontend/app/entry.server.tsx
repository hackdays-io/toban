import { type EntryContext, ServerRouter } from "react-router";
import { createEmotion } from "./emotion/emotion-server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const { renderToString, injectStyles } = createEmotion();

  const html = renderToString(
    <ServerRouter context={routerContext} url={request.url} />,
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response(`<!DOCTYPE html>${injectStyles(html)}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
