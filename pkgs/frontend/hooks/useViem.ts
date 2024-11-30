import { createPublicClient, http } from "viem";
import { mainnet, sepolia, base, optimism } from "viem/chains";

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

export const publicClient = createPublicClient({
	chain: currentChain,
	transport: http(),
});
