import { http, createPublicClient } from "viem";
import { base, mainnet, optimism, sepolia } from "viem/chains";

export const chainId = Number(import.meta.env.VITE_CHAIN_ID) || 1;

export const currentChain =
  chainId === 1
    ? mainnet
    : chainId === 11155111
      ? sepolia
      : chainId === 10
        ? optimism
        : chainId === 8453
          ? base
          : sepolia;

/**
 * Public client for fetching data from the blockchain
 */
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(
    "https://eth-sepolia.g.alchemy.com/v2/EgXo1KLF1BxzM0a_kmI9Mypxvfu_UqgU",
  ),
});
