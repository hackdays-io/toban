import { hatIdDecimalToIp } from '@hatsprotocol/sdk-v1-core';
import { Hat } from '@hatsprotocol/sdk-v1-subgraph';
import { useChainId } from 'wagmi';

import useHatContractWrite, { ValidFunctionName } from './useHatContractWrite';

const useHatMint = ({
  selectedHat,
  chainId,
  wearer,
}: {
  selectedHat: Hat;
  chainId: number;
  wearer: `0x${string}`;
}) => {
  const currentNetworkId = useChainId();
  const hatId = selectedHat?.id;

  const txDescription =
    hatId && `Minted hat ${hatIdDecimalToIp(BigInt(hatId))}`;

  /**
   * Hatを民とするメソッド
   */
  const {
    writeAsync,
    isLoading,
  } = useHatContractWrite({
    functionName: 'mintHat' as ValidFunctionName,
    args: [BigInt(hatId), wearer],
    chainId,
    txDescription,
    enabled: Boolean(hatId) && chainId === currentNetworkId,
  });

  return { writeAsync, isLoading };
};

export default useHatMint;
