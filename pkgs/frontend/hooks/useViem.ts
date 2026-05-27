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

// Chain-specific Alchemy RPC URL. Centralised so both `publicClient` (fallback
// transport, used by the rest of the app) and `alchemyPublicClient` (single
// transport, used by the Splits SDK so its Alchemy detection works) share the
// exact same URL string. See `alchemyPublicClient` below for the why.
const alchemyRpcUrl =
  chainId === 1
    ? `https://eth.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`
    : chainId === 11155111
      ? `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`
      : chainId === 10
        ? `https://opt-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`
        : chainId === 8453
          ? `https://base-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`
          : `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`;

// Public-node RPC per chain. Adds a free, keyless fallback layer between
// viem's built-in default (chain.rpcUrls.default) and Alchemy, so a single
// provider hitting a rate limit / outage doesn't bring writes down.
const publicNodeRpcUrl =
  chainId === 1
    ? "https://ethereum-rpc.publicnode.com"
    : chainId === 11155111
      ? "https://ethereum-sepolia-rpc.publicnode.com"
      : chainId === 10
        ? "https://optimism-rpc.publicnode.com"
        : chainId === 8453
          ? "https://base-rpc.publicnode.com"
          : "https://ethereum-sepolia-rpc.publicnode.com";

// viem's default is `retryCount: 3` with exponential backoff. On a rate-limit
// or outage that wastes the next-tier fallback's headroom (and Alchemy's
// monthly CU when the storm happens to land there). One retry is enough for a
// genuine transient blip; anything worse, fall through to the next transport.
const HTTP_RETRY = { retryCount: 1 } as const;

export const currentChainRPCBaseURL = [http(alchemyRpcUrl, HTTP_RETRY)];

/**
 * Public client for fetching data from the blockchain.
 *
 * Fallback order: viem default public RPC → publicnode → Alchemy. We lead with
 * keyless public endpoints so we don't burn the Alchemy monthly cap on every
 * read; Alchemy stays as the last-resort backup.
 */
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: fallback([
    http(undefined, HTTP_RETRY),
    http(publicNodeRpcUrl, HTTP_RETRY),
    http(alchemyRpcUrl, HTTP_RETRY),
  ]),
});

// The Splits SDK auto-discovers ERC20s deposited to a Split via `getLogs` when
// `erc20TokenList` is omitted, but it only takes that path after sniffing the
// public client's `transport.url` for `.alchemy.` / `.infura.` (see
// `@0xsplits/splits-sdk/dist/src/utils/requests.js:isAlchemyPublicClient`).
// viem's `fallback` transport has no top-level `url`, so the sniff fails on
// `publicClient` and the SDK throws "Token list required if public client is
// not alchemy or infura". This single-transport client exposes the Alchemy URL
// directly so the SDK takes the discovery path. Use it only for the Splits
// SDK; everything else should keep using `publicClient` for fallback redundancy.
export const alchemyPublicClient = createPublicClient({
  chain: currentChain,
  transport: http(alchemyRpcUrl, HTTP_RETRY),
});
