import { hatIdDecimalToIp } from '@hatsprotocol/sdk-v1-core';
import { Hat } from '@hatsprotocol/sdk-v1-subgraph';
import { useChainId } from 'wagmi';

import useHatContractWrite, { ValidFunctionName } from './useHatContractWrite';

const useHatBurn = ({
  selectedHat,
  chainId,
}: {
  selectedHat: Hat; // AppHat;
  chainId: number; // SupportedChains;
  waitForSubgraph?: () => void | undefined;
}) => {
  const currentNetworkId = useChainId();

  const hatId = selectedHat?.id;

  const txDescription =
    hatId && `Renounced hat ${hatIdDecimalToIp(BigInt(hatId))}`;

  const { writeAsync, isLoading } =
    useHatContractWrite({
      functionName: 'renounceHat' as ValidFunctionName,
      args: [BigInt(hatId)],
      chainId: Number(chainId),
      txDescription,
      onSuccessToastData: {
        title: 'Hat removed!',
        description: txDescription,
      },
      enabled: Boolean(hatId) && chainId === currentNetworkId,
    });

  return { writeAsync, isLoading };
};

export default useHatBurn;
