import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import { renderToString } from "react-dom/server";
import { ChakraProvider } from "../components/chakra-provider";
import { createEmotionCache } from "./emotion-cache";

export function createEmotion() {
  const cache = createEmotionCache();
  const server = createEmotionServer(cache);

  function injectStyles(element: React.ReactNode): React.ReactNode {
    const htmlString = renderToString(element);
    const { styles } = server.extractCriticalToChunks(htmlString);

    const styleElements = styles.map(({ key, ids, css }) => (
      <style
        key={key}
        data-emotion={`${key} ${ids.join(" ")}`}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{ __html: css }}
      />
    ));
    return (
      <>
        {/* emotion insertion point meta tag */}
        <meta
          name="emotion-insertion-point"
          content="emotion-insertion-point"
        />
        {styleElements}
        {element}
      </>
    );
  }

  function renderElement(element: React.ReactNode): React.ReactNode {
    return (
      <CacheProvider value={cache}>
        <ChakraProvider>{element}</ChakraProvider>
      </CacheProvider>
    );
  }

  return {
    server,
    cache,
    injectStyles,
    renderElement,
  };
}
