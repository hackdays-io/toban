import { useChainId } from 'wagmi';

const useIsSameChain = (chainId: number | undefined) => {
  const currentNetworkId = useChainId();
  return chainId === currentNetworkId;
};

export default useIsSameChain;
