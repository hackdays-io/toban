import { Module } from '@hatsprotocol/modules-sdk';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';
import { Hex } from 'viem';

const useModulesDetails = ({
  moduleIds,
  chainId,
  editMode,
}: {
  moduleIds: Hex[] | null;
  chainId: number | undefined; //  SupportedChains | undefined;
  editMode?: boolean;
}) => {
  const fetchModulesData = async () => {
    if (!chainId || !moduleIds) {
      return [];
    }
    const moduleClient = undefined; // await createHatsModulesClient(chainId);
    if (!moduleClient) return [];

    const result: any[] = []; // await moduleClient.getModulesByInstances(moduleIds);

    // map with moduleIds
    const mappedModules = _.map(result, (moduleInfo: Module, index: number) => {
      if (!moduleInfo) return undefined;

      const fullDetails = {
        ...moduleInfo,
        id: moduleIds[index],
      };
      return fullDetails;
    });

    return _.compact(mappedModules) as unknown as any[];
  };

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ['modulesDetails', moduleIds, chainId],
    queryFn: fetchModulesData,
    enabled: !!chainId,
    staleTime: editMode ? Infinity : 1000 * 60 * 15, // 15 minutes
  });

  return {
    modulesDetails: isSuccess ? data : [],
    isLoading: isLoading && !isSuccess,
  };
};

export default useModulesDetails;
