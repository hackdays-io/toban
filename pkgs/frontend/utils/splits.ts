import { SplitsClient } from "@0xsplits/splits-sdk";
import { currentChain, publicClient } from "hooks/useViem";

export const splitsDataClient = new SplitsClient({
  chainId: currentChain.id,
  apiConfig: {
    apiKey: import.meta.env.VITE_SPLITS_API_KEY,
  },
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  publicClient: publicClient as any,
}).dataClient;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const getSplitsWriteClient = (walletClient: any) => {
  return new SplitsClient({
    chainId: currentChain.id,
    apiConfig: {
      apiKey: import.meta.env.VITE_SPLITS_API_KEY,
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    walletClient: walletClient as any,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    publicClient: publicClient as any,
  });
};
