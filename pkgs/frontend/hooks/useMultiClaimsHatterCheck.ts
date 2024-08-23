import { Module } from '@hatsprotocol/modules-sdk';
import { Hat } from '@hatsprotocol/sdk-v1-subgraph';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { useMemo } from 'react';
import { Hex } from 'viem';

import { CLAIMS_HATTER_MODULE_NAME } from '@/lib/constants';
import { createSubgraphClient } from '@/lib/hats';

import useIsAdmin from './useIsAdmin';
import useModuleDetails from './useModuleDetails';
import useModulesDetails from './useModulesDetails';

const fetchHattersHelper = async (chainId: number, hats: Hex[]) => {
  const subgraphClient = createSubgraphClient();
  const res = subgraphClient.getHatsByIds({
    chainId,
    hatIds: hats.map((hat) => BigInt(hat)),
    props: {
      claimableBy: { props: {} },
      claimableForBy: { props: {} },
    },
  });

  return res as unknown as Promise<Hat[]>;
};

const fetchHatters = async (
  chainId: number | undefined,
  allHatIds: Hex[] | undefined
) => {
  if (!chainId || !allHatIds) return undefined;
  const result = await fetchHattersHelper(chainId, allHatIds);
  return result;
};

const getHatterHat = async (
  claimsHatterData: Hat[] | undefined,
  storedModuleDetails: Module[] | undefined,
  storedData: Partial<FormData>[] | undefined,
  chainId: number | undefined
) => {
  if (!chainId) return {};

  const onchainHatId = _.first(
    _.compact(_.map(claimsHatterData, 'claimableBy[0].id'))
  );

  const claimsHatterIndex = _.findIndex(
    storedModuleDetails,
    (result: Module) => _.get(result, 'name') === CLAIMS_HATTER_MODULE_NAME
  );
  const storedDataHatId = _.get(storedData, `[${claimsHatterIndex}].id`);

  const address = onchainHatId || storedDataHatId;

  if (address) {
    const result = { currentHats: [] };// await fetchWearerDetails(address, chainId);

    return {
      wearingHat: _.get(result, 'currentHats.[0].id'),
      instanceAddress: address,
    };
  }
  return {};
};

const useMultiClaimsHatterCheck = ({
  chainId,
  selectedHat,
  onchainHats,
  storedData,
  editMode,
}: {
  chainId: number | undefined;
  selectedHat?: Hat | null;
  onchainHats: Hat[] | undefined;
  storedData?: Partial<FormData>[] | undefined;
  editMode?: boolean;
}) => {
  const allHatIds = useMemo(() => _.map(onchainHats, 'id'), [onchainHats]);

  const {
    data: claimsHatterData,
    isLoading: claimsHatterLoading,
    error: claimsHatterError,
  } = useQuery({
    queryKey: ['claimsHatter', allHatIds, chainId],
    queryFn: () => fetchHatters(chainId, allHatIds),
    enabled: !!allHatIds && !!chainId,
    staleTime: editMode ? Infinity : 1000 * 60 * 15, // 15 minutes
  });

  const claimableHats: Hex[] | undefined = useMemo(() => {
    if (!claimsHatterData) return undefined;

    return _.map(_.filter(claimsHatterData, 'claimableBy[0].id'), 'id');
  }, [claimsHatterData]);
  const claimableForHats: Hex[] | undefined = useMemo(() => {
    if (!claimsHatterData) return undefined;

    return _.map(_.filter(claimsHatterData, 'claimableForBy[0].id'), 'id');
  }, [claimsHatterData]);
  const currentHatIsClaimable = useMemo(() => {
    if (!selectedHat || !claimableHats) return undefined;

    return {
      for: _.includes(claimableForHats, selectedHat?.id) || false,
      by: _.includes(claimableHats, selectedHat?.id) || false,
    };
  }, [selectedHat, claimableHats, claimableForHats]);

  const storedAddresses = _.uniq(
    _.compact(
      _.flatMap(storedData, ({ eligibility, toggle }: Partial<any>) => [
        eligibility,
        toggle,
      ])
    )
  );

  const { modulesDetails, isLoading: modulesLoading } = useModulesDetails({
    moduleIds: storedAddresses,
    chainId,
    editMode,
  });

  const storedDataClaimableHats = _.compact(
    // ! Module isn't quite the right type here
    _.map(modulesDetails, (data: Module, index: number) => {
      if (data) {
        return _.get(storedData, `[${index}].id`);
      }
      return null;
    })
  );

  // uhh?
  const hats = _.uniq(_.concat(claimableHats, storedDataClaimableHats as unknown as Hex[]));

  const {
    data: hatterHat,
    isLoading: hatterHatLoading,
    error: hatterHatError,
  } = useQuery({
    queryKey: [
      'hatterHat',
      { chainId, hats: _.map(claimsHatterData, 'id') },
      { storedModulesDetailsData: modulesDetails, storedData },
    ],
    queryFn: () =>
      getHatterHat(claimsHatterData, modulesDetails, storedData, chainId),
    enabled: !!chainId && !!claimsHatterData,
    staleTime: editMode ? Infinity : 1000 * 60 * 15, // 15 minutes
  });

  const { details } = useModuleDetails({
    address: hatterHat?.instanceAddress,
    chainId,
  });
  const hatterIsAdmin = useIsAdmin({
    address: hatterHat?.instanceAddress,
    hatId: selectedHat?.id,
    chainId,
  });

  return {
    multiClaimsHatter: details,
    wearingHat: hatterHat?.wearingHat,
    instanceAddress: hatterHat?.instanceAddress,
    hatterIsAdmin,
    currentHatIsClaimable,
    claimableHats: hats,
    claimableForHats,
    isLoading: claimsHatterLoading || hatterHatLoading || modulesLoading,
    error: claimsHatterError || hatterHatError,
  };
};

export default useMultiClaimsHatterCheck;
