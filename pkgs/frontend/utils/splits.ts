import { SplitsClient } from "@0xsplits/splits-sdk";
import { currentChain } from "hooks/useViem";

export const splitsDataClient = new SplitsClient({
  chainId: currentChain.id,
  apiConfig: {
    apiKey: import.meta.env.VITE_SPLITS_API_KEY,
  },
}).dataClient;
