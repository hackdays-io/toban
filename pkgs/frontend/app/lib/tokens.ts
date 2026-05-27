import type { Address } from "viem";

export type TokenPreset = {
  symbol: string;
  name: string;
  /** Lowercase ERC20 contract address. */
  address: Address;
  decimals: number;
};

/**
 * Canonical ERC20 presets keyed by chain id. The "Other / custom address"
 * fallback in the UI lives outside this map — anything not listed here can
 * still be entered manually.
 *
 * TODO: double-check JPYC addresses with the operator before mainnet rollout.
 * Sepolia entries are best-effort testnet deployments.
 */
export const TOKEN_PRESETS: Record<number, TokenPreset[]> = {
  // Sepolia
  11155111: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      decimals: 6,
    },
    {
      symbol: "JPYC",
      name: "JPY Coin",
      // JPYC has no canonical Sepolia deployment at the time of writing.
      // The operator should override this via the "Other" input until a
      // canonical sepolia JPYC exists.
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
    },
  ],
  // Base mainnet
  8453: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
    {
      symbol: "JPYC",
      name: "JPY Coin",
      address: "0x6cAE7c0D60af2118E4Ee9d418b54D8C8Cae35BB6",
      decimals: 18,
    },
  ],
};

export const getTokenPresets = (chainId: number): TokenPreset[] =>
  (TOKEN_PRESETS[chainId] ?? []).filter(
    (t) => t.address !== "0x0000000000000000000000000000000000000000",
  );

/** Find a preset by case-insensitive address match. */
export const findTokenPreset = (
  chainId: number,
  address?: string,
): TokenPreset | undefined => {
  if (!address) return undefined;
  const presets = TOKEN_PRESETS[chainId] ?? [];
  const lc = address.toLowerCase();
  return presets.find((t) => t.address.toLowerCase() === lc);
};
