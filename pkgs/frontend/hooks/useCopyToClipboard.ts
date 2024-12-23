import { useCallback } from "react";

export const useCopyToClipboard = (content: string) => {
  const copyToClipboardAction = useCallback(() => {
    return navigator.clipboard.writeText(content);
  }, [content]);

  return { copyToClipboardAction };
};
