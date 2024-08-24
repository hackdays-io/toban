import { HatsClient, hatIdDecimalToIp } from '@hatsprotocol/sdk-v1-core';
import { useChainId } from 'wagmi';
import useHatContractWrite, { ValidFunctionName } from './useHatContractWrite';
import { createHatsClient } from '@/lib/hats';
import { getWalletClient } from 'wagmi/actions';
import { wagmiConfig } from '@/lib/web3';

const useTopHatMint = async({
  chainId,
  adminWearer,
}: {
  chainId: number;
  adminWearer: `0x${string}`;
}) => {
    const walletClient: any = await getWalletClient(wagmiConfig);
    const currentNetworkId = useChainId();
    const txDescription = `TopHatMinted hat to 0x${adminWearer}`;
    const imageURI = "ipfs://bafkreiflezpk3kjz6zsv23pbvowtatnd5hmqfkdro33x5mh2azlhne3ah4"

  /**
   * TopHatをMintするメソッド
   */
  const {
    writeAsync,
    isLoading,
  } = useHatContractWrite({
    functionName: 'mintHat' as ValidFunctionName,
    args: [walletClient, adminWearer, txDescription, imageURI],
    chainId,
    txDescription,
    enabled: chainId === currentNetworkId,
  });

  return { writeAsync, isLoading };
};

export default useTopHatMint;
