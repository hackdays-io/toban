import { SplitsClient } from "@0xsplits/splits-sdk";
import { alchemyPublicClient, currentChain } from "hooks/useViem";

// Pass the Alchemy-only client (not the fallback `publicClient`) so the SDK's
// auto-discovery of ERC20s deposited to a Split works — see the comment on
// `alchemyPublicClient` in `hooks/useViem.ts`.
export const splitsDataClient = new SplitsClient({
  chainId: currentChain.id,
  apiConfig: {
    apiKey: import.meta.env.VITE_SPLITS_API_KEY,
  },
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  publicClient: alchemyPublicClient as any,
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
    publicClient: alchemyPublicClient as any,
  });
};
