import ReactDOMServer from "react-dom/server";
import { type EntryContext, ServerRouter } from "react-router";
import { createEmotion } from "./emotion/emotion-server";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  let isFailure = false;
  const { renderToReadableStream } = ReactDOMServer;

  // Block .well-known requests immediately
  const url = new URL(request.url);
  if (url.pathname.startsWith("/.well-known")) {
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
  // responseHeaders.delete("Content-Security-Policy");

  const { renderElement } = createEmotion();

  const element = renderElement(
    <ServerRouter context={routerContext} url={request.url} />,
  );
  responseHeaders.set("Content-Type", "text/html");

  const controller = new AbortController();
  const stream = await renderToReadableStream(element, {
    signal: controller.signal,
    onError(error) {
      isFailure = true;
      console.error(error);
    },
  });

  return new Response(stream, {
    status: isFailure ? 500 : responseStatusCode,
    headers: responseHeaders,
  });
}
