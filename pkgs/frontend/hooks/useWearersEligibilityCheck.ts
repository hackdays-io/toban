import { Hat } from '@hatsprotocol/sdk-v1-subgraph';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Hex } from 'viem';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fetchWearersEligibilities = (ids: Hex[], hatId: Hex, chainId: number) => {
  return null;
};

/** `useWearersEligibilityCheck` is a hook that checks the eligibility of wearers for a given hat.
 * @param selectedHat - The selected hat
 * @param wearerIds - An optional list of wearer ids (will use the selected hat's wearers if not provided)
 * @param chainId - The chain id for the hat, generally
 * @param editMode - Whether the hook is being used in edit mode (turn off refetch)
 */
const useWearersEligibilityCheck = ({
  selectedHat,
  wearerIds,
  chainId,
  editMode = false,
}: useWearersEligibilityCheckProps) => {
  const hatId = selectedHat?.id;
  const wearers = selectedHat?.wearers;
  const localWearerIds = wearerIds || _.map(wearers, 'id');

  const { data, isLoading, error } = useQuery({
    queryKey: ['wearerEligibility', localWearerIds, hatId, chainId],
    queryFn: () => fetchWearersEligibilities(localWearerIds, hatId, chainId),
    staleTime: editMode ? Infinity : 15 * 1000 * 60,
  });

  return { data, isLoading, error };
};

export default useWearersEligibilityCheck;

interface useWearersEligibilityCheckProps {
  selectedHat: Hat; // AppHat;
  wearerIds?: Hex[];
  chainId: number;
  editMode?: boolean;
}
