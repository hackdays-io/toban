import { SplitsClient } from "@0xsplits/splits-sdk";
import { alchemyPublicClient, currentChain, publicClient } from "hooks/useViem";

// Pass the Alchemy-only client (not the fallback `publicClient`) so the SDK's
// auto-discovery of ERC20s deposited to a Split works — see the comment on
// `alchemyPublicClient` in `hooks/useViem.ts`. Used for read paths
// (`getUserEarnings`, `getSplitEarnings`) that may need log-based discovery.
export const splitsDataClient = new SplitsClient({
  chainId: currentChain.id,
  apiConfig: {
    apiKey: import.meta.env.VITE_SPLITS_API_KEY,
  },
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  publicClient: alchemyPublicClient as any,
}).dataClient;

// Write paths (withdraw / distribute) only call `simulateContract` + the
// wallet's `writeContract`. The SDK's `isAlchemyPublicClient` sniff is gated
// to log-based ERC20 discovery (see
// `node_modules/@0xsplits/splits-sdk/dist/src/utils/requests.js:isLogsPublicClient`)
// so writes don't need an Alchemy URL. Using the fallback `publicClient`
// here means writes survive Alchemy outages / rate limits by falling through
// to the keyless public RPC defined in `useViem.ts`.
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
