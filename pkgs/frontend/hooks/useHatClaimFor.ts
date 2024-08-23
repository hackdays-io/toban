import { Module } from '@hatsprotocol/modules-sdk';
import { Hat } from '@hatsprotocol/sdk-v1-subgraph';
import { first, get } from 'lodash';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { Hex, isAddress } from 'viem';
import { useAccount, useReadContract } from 'wagmi';

import { CLAIMS_HATTER_MODULE_NAME } from '@/lib/constants';
import { createHatsClient, createHatsModulesClient } from '@/lib/hats';

const useHatClaimFor = ({
  selectedHat,
  chainId,
  wearer,
}: {
  selectedHat?: Hat; // AppHat | null;
  chainId?: number; // SupportedChains;
  wearer: Hex | undefined;
}) => {
  const [claimsHatter, setClaimsHatter] = useState<Module | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  const [canClaimForAccount, setCanClaimForAccount] = useState<boolean>();

  const claimableForAddress: Hex | undefined = useMemo(
    () => get(first(get(selectedHat, 'claimableForBy')), 'id') as Hex,
    [selectedHat]
  );

  const { data: isClaimableFor, isLoading: isLoadingClaimableFor } =
    useReadContract({
      address: claimableForAddress,
      abi: claimsHatter?.abi,
      chainId,
      functionName: 'isClaimableFor',
      args: [wearer || '0x', selectedHat?.id || '0x'],
    });

  useEffect(() => {
    const getCanClaimForAccount = async () => {
      const hatsClient = await createHatsClient(chainId);
      if (!hatsClient || !wearer || !isAddress(wearer)) return;
      const canClaimFor = await hatsClient.canClaimForAccount({
        hatId: BigInt(selectedHat?.id || '0x'),
        account: wearer,
      });

      setCanClaimForAccount(canClaimFor);
    };
    getCanClaimForAccount();
  }, [chainId, selectedHat, wearer]);

  const claimHatFor = async (account: Hex) => {
    const hatsClient = await createHatsClient(chainId);
    if (!hatsClient || !address) return;

    try {
      setIsLoading(true);

      const result = await hatsClient.claimHatFor({
        account: address,
        hatId: BigInt(selectedHat?.id || '0x'),
        wearer: account,
      });

      if (result?.status === 'success') {
        // toast.success({
        //   title: 'Hat claimed',
        //   description: selectedHat?.id && address && `Hat ${hatIdDecimalToHex(BigInt(
        //     selectedHat?.id,
        //   ))} has been claimed for ${formatAddress(account)}`,
        // });
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      // const err = error as Error;
      // toast.error({
      //   title: 'Transaction failed',
      //   description: err.message,
      // });
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  useEffect(() => {
    const getHatter = async () => {
      const moduleClient = await createHatsModulesClient(chainId);
      if (!moduleClient) return;
      const modules = moduleClient?.getModules();
      if (!modules) return;
      const moduleData = _.find(modules, {
        name: CLAIMS_HATTER_MODULE_NAME,
      });
      if (!moduleData) return;
      setClaimsHatter(moduleData);
    };
    getHatter();
  }, [chainId]);

  return {
    claimHatFor,
    isClaimableFor,
    canClaimForAccount,
    isLoading: isLoading || isLoadingClaimableFor,
  };
};

export default useHatClaimFor;
