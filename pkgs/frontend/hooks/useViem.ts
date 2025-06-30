import { http, createPublicClient, fallback } from "viem";
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

export const currentChainRPCBaseURL =
  chainId === 1
    ? [http(`https://eth.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`)]
    : chainId === 11155111
      ? [
          http(
            `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
          ),
        ]
      : chainId === 10
        ? [
            http(
              `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
            ),
          ]
        : chainId === 8453
          ? [
              http(
                `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
              ),
            ]
          : [
              http(
                `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
              ),
            ];

/**
 * Public client for fetching data from the blockchain
 */
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: fallback([http(), ...currentChainRPCBaseURL]),
});
