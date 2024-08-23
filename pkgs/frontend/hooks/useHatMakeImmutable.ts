import {
  hatIdDecimalToIp,
  hatIdHexToDecimal,
  hatIdToTreeId,
} from '@hatsprotocol/sdk-v1-core';
import { Hat } from '@hatsprotocol/sdk-v1-subgraph';
import _ from 'lodash';
import { useChainId } from 'wagmi';

import useHatContractWrite, { ValidFunctionName } from './useHatContractWrite';

const useHatMakeImmutable = ({
  selectedHat,
  onchainHats,
  chainId,
  isAdminUser,
  mutable,
}: UseHatMakeImmutableProps) => {
  const currentNetworkId = useChainId();
  const selectedHatId = selectedHat?.id;

  const { writeAsync, isLoading } = useHatContractWrite({
    functionName: 'makeHatImmutable' as ValidFunctionName,
    args: [hatIdHexToDecimal(selectedHatId)],
    chainId: Number(chainId),
    onSuccessToastData: {
      title: 'Hat Updated!',
      description:
        selectedHatId &&
        `Successfully made hat #${hatIdDecimalToIp(
          BigInt(selectedHatId)
        )} immutable`,
    },
    queryKeys: [
      ['hatDetails', { id: selectedHatId, chainId }],
      [
        'treeDetails',
        !!selectedHatId ? hatIdToTreeId(BigInt(selectedHatId)) : {},
      ],
    ],
    enabled:
      !!selectedHatId &&
      !!selectedHat?.mutable &&
      Boolean(hatIdHexToDecimal(selectedHatId)) &&
      !!mutable &&
      _.gt(selectedHat?.levelAtLocalTree, 0) &&
      _.includes(_.map(onchainHats, 'id'), selectedHatId) &&
      !!isAdminUser &&
      chainId === currentNetworkId,
  });

  return { writeAsync, isLoading };
};

export default useHatMakeImmutable;

interface UseHatMakeImmutableProps {
  selectedHat: Hat; // AppHat;
  onchainHats: Hat[]; // AppHat[];
  chainId: number | undefined; // SupportedChains | undefined;
  isAdminUser?: boolean;
  mutable?: boolean;
}
