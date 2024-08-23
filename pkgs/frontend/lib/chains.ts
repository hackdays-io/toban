import {
  arbitrum,
  base,
  celo,
  // baseSepolia,
  Chain,
  gnosis,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';

// ORDER HERE WILL BE USED IN THE UI
export const orderedChains: number[] = [
  // main networks
  1, // mainnet
  10, // optimism
  42161, // arbitrum
  137, // polygon
  100, // gnosis
  8453, // base
  42220, // celo
  // testnets
  11155111, // sepolia
  // 84532 // baseSepolia
];

export const extendIcon = (chain: Chain) => ({
  ...chain,
  hasIcon: true,
  // iconUrl: networkImages[chain.id as number],
  iconBackground: 'none',
});

export const chainsList: { [key in number]: Chain } = {
  1: mainnet,
  10: optimism,
  42161: arbitrum,
  137: polygon,
  100: gnosis,
  8453: base,
  42220: celo,

  // TESTNETS
  11155111: sepolia,
  // 84532: baseSepolia,
};
