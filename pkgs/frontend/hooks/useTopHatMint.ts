import { useAccount, useChainId } from 'wagmi';
import useHatContractWrite, { ValidFunctionName } from './useHatContractWrite';

const useTopHatMint = ({
  chainId,
}: {
  chainId: number;
}) => {
    // const walletClient: any = await getWalletClient(wagmiConfig);
    const {address} = useAccount()
    const currentNetworkId = useChainId();
    const imageURI = "ipfs://bafkreiflezpk3kjz6zsv23pbvowtatnd5hmqfkdro33x5mh2azlhne3ah4"
    const imageURTVerNekko = "https://lime-giant-dove-621.mypinata.cloud/ipfs/QmWgN2Z4jTz9c9Yw9YSAp7KZJcoCU47qPwPS6hp6xQQZDY"

  /**
   * TopHatをMintするメソッド
   */
  const {
    writeAsync,
    isLoading,
  } = useHatContractWrite({
    functionName: 'mintTopHat' as ValidFunctionName,
    args: [address!,  "test project", imageURTVerNekko],
    chainId,
    enabled: chainId === currentNetworkId,
  });

  return { writeAsync, isLoading };
};

export default useTopHatMint;
