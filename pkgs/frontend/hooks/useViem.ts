import { http, type Chain, createPublicClient } from "viem";
import { base, mainnet, optimism, sepolia } from "viem/chains";

export const chainId = Number(import.meta.env.VITE_CHAIN_ID) || 1;

// サポートするチェーンの定義
export const SUPPORTED_CHAINS = {
  MAINNET: mainnet,
  SEPOLIA: sepolia,
  OPTIMISM: optimism,
  BASE: base,
} as const;

// チェーンIDからチェーンを取得する関数
export const getChainById = (id: number): Chain => {
  switch (id) {
    case 1:
      return SUPPORTED_CHAINS.MAINNET;
    case 11155111:
      return SUPPORTED_CHAINS.SEPOLIA;
    case 10:
      return SUPPORTED_CHAINS.OPTIMISM;
    case 8453:
      return SUPPORTED_CHAINS.BASE;
    default:
      return SUPPORTED_CHAINS.SEPOLIA; // デフォルトチェーン
  }
};

export const currentChain = getChainById(chainId);

// サポートされているすべてのチェーンのリスト
export const supportedChains = Object.values(SUPPORTED_CHAINS);

/**
 * Public client for fetching data from the blockchain
 */
export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(),
});
