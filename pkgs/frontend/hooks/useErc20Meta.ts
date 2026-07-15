import { useQueries } from "@tanstack/react-query";
import { ERC20_ABI } from "abi/erc20";
import { useMemo } from "react";
import type { Address } from "viem";
import { findTokenPreset } from "~/lib/tokens";
import { chainId as currentChainId, publicClient } from "./useViem";

export type Erc20Meta = {
  address: string;
  symbol: string;
  decimals: number;
};

/**
 * Resolve ERC20 metadata (symbol + decimals) for a set of token addresses.
 * Checks the local preset map first (no RPC) and falls back to on-chain
 * reads for unknown tokens so the UI can render the correct ticker even
 * when the operator picks a token outside the curated preset list.
 */
export const useErc20Meta = (addresses: ReadonlyArray<string | undefined>) => {
  const unique = useMemo(() => {
    const set = new Set<string>();
    for (const a of addresses) if (a) set.add(a.toLowerCase());
    return Array.from(set);
  }, [addresses]);

  const queries = useQueries({
    queries: unique.map((address) => ({
      queryKey: ["erc20-meta", currentChainId, address],
      queryFn: async (): Promise<Erc20Meta> => {
        const preset = findTokenPreset(currentChainId, address);
        if (preset) {
          return {
            address,
            symbol: preset.symbol,
            decimals: preset.decimals,
          };
        }
        const [symbol, decimals] = await Promise.all([
          publicClient.readContract({
            address: address as Address,
            abi: ERC20_ABI,
            functionName: "symbol",
          }),
          publicClient.readContract({
            address: address as Address,
            abi: ERC20_ABI,
            functionName: "decimals",
          }),
        ]);
        return {
          address,
          symbol: String(symbol),
          decimals: Number(decimals),
        };
      },
      staleTime: Number.POSITIVE_INFINITY,
    })),
  });

  const byAddress = useMemo(() => {
    const m = new Map<string, Erc20Meta>();
    for (const q of queries) {
      if (q.data) m.set(q.data.address.toLowerCase(), q.data);
    }
    return m;
  }, [queries]);

  return { byAddress };
};
