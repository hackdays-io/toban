import { Module } from '@hatsprotocol/modules-sdk';
import { hatIdDecimalToIp } from '@hatsprotocol/sdk-v1-core';
import { Hat } from '@hatsprotocol/sdk-v1-subgraph';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Hex } from 'viem';
import {
  useAccount,
  useChainId,
  useReadContracts,
  useWriteContract,
} from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';

import { CLAIMS_HATTER_MODULE_NAME } from '@/lib/constants';
import { createHatsModulesClient } from '@/lib/hats';
import { wagmiConfig } from '@/lib/web3';

const useHatClaimBy = ({
  selectedHat,
  chainId,
  wearer,
  // onSuccess,
}: {
  selectedHat?: Hat | undefined; // AppHat | null;
  chainId: number | undefined; // SupportedChains | undefined;
  wearer: Hex | undefined;
  // onSuccess?: () => void;
}) => {
  const [claimsHatter, setClaimsHatter] = useState<Module | undefined>();
  const { address } = useAccount();
  const userChain = useChainId();
  const isCurrentWearer = address === wearer;

  const isWearing = useMemo(
    () => _.includes(_.map(selectedHat?.wearers, 'id'), wearer),
    [selectedHat, wearer],
  );

  const claimsHatterAddress: Hex | undefined = useMemo(
    () => _.get(_.first(_.get(selectedHat, 'claimableBy')), 'id') as unknown as Hex, // TODO ! fix me
    [selectedHat],
  );

  const hatter = {
    address: claimsHatterAddress,
    abi: claimsHatter?.abi,
    chainId,
  };

  const { data: isClaimableData } = useReadContracts({
    contracts: [
      {
        ...hatter,
        functionName: 'accountCanClaim',
        args: [wearer || '0x', selectedHat?.id || '0x'],
      },
      {
        ...hatter,
        functionName: 'wearsAdmin',
        args: [selectedHat?.id || '0x'],
      },
    ],
  });

  const [isClaimable, isClaimableAdmin] = useMemo(
    () => _.map(isClaimableData, 'result') || [false, false],
    [isClaimableData],
  );

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

  const { writeContractAsync } = useWriteContract()

  const handleClaimHat = async () => {
    if (
      !isCurrentWearer ||
      !isClaimable ||
      isWearing ||
      !isClaimableAdmin ||
      !claimsHatter ||
      !claimsHatterAddress ||
      userChain !== chainId
    ) {
      return;
    }

    return writeContractAsync({
      address: claimsHatterAddress,
      chainId,
      abi: claimsHatter?.abi,
      functionName: isCurrentWearer ? 'claimHat' : 'claimHatFor',
      args: isCurrentWearer ? [selectedHat?.id] : [selectedHat?.id, address],
    }).then(async (hash) => {
      toast.info('Transaction submitted');

      await waitForTransactionReceipt(wagmiConfig, { chainId: chainId as any, hash });

      const txDescription = `You've claimed ${selectedHat?.id
        ? `hat ID ${hatIdDecimalToIp(BigInt(selectedHat?.id))}`
        : 'this hat'
        }.`;

      toast.success(txDescription)

      // TODO handle invalidate after transaction
    }).catch((error) => {
      if (
        error.name === 'TransactionExecutionError' &&
        error.message.includes('User rejected the request')
      ) {
        console.log({
          title: 'Signature rejected!',
          description: 'Please accept the transaction in your wallet',
        })
        // toast.error({
        //   title: 'Signature rejected!',
        //   description: 'Please accept the transaction in your wallet',
        // });
      } else {
        console.log({
          title: 'Error occurred!',
          description: 'An error occurred while processing the transaction.',
        })
        // toast.error({
        //   title: 'Error occurred!',
        //   description: 'An error occurred while processing the transaction.',
        // });
      }
    })
  }

  return {
    claimHat: handleClaimHat,
    isClaimable,
    hatterAddress: claimsHatterAddress,
    hatterIsAdmin: isClaimableAdmin,
    canClaimFor: isClaimable,
  };
};

export default useHatClaimBy;
