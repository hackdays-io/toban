import { useChainId } from 'wagmi';

import useHatContractWrite, { ValidFunctionName } from './useHatContractWrite';

const useHatMint = ({
  chainId,
  hatId,
}: {
  chainId: number;
  hatId: bigint;
}) => {
  const currentNetworkId = useChainId();
  const wearer = "0xe3946ec13631B04CF9AB3630d1c7165AC719de13" // TimeFrameHatModule

  /**
   * Hatをミントするメソッド
   */
  const {
    writeAsync,
    isLoading,
  } = useHatContractWrite({
    functionName: 'mintHat' as ValidFunctionName,
    args: [hatId, wearer],
    chainId,
    enabled: Boolean(hatId) && chainId === currentNetworkId,
  });

  return { writeAsync, isLoading };
};

export default useHatMint;
