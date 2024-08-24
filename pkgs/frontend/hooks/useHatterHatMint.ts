import { useChainId } from 'wagmi';
import useHatContractWrite, { ValidFunctionName } from './useHatContractWrite';

const useHatterHatMint = ({
  chainId,
  hatId
}: {
  chainId: number;
  hatId: number;
}) => {
    const currentNetworkId = useChainId();
    const imageURI = "ipfs://bafkreiflezpk3kjz6zsv23pbvowtatnd5hmqfkdro33x5mh2azlhne3ah4"
    const imageURTVerNekko = "https://lime-giant-dove-621.mypinata.cloud/ipfs/QmWgN2Z4jTz9c9Yw9YSAp7KZJcoCU47qPwPS6hp6xQQZDY"

  /**
   * HatterHatをMintするメソッド
   */
  const {
    writeAsync,
    isLoading,
  } = useHatContractWrite({
    functionName: 'createHat' as ValidFunctionName,
    args: [
      hatId,
      "role1",
      10,
      "0x0000000000000000000000000000000000004a75",
      "0x0000000000000000000000000000000000004a75",
      true as any,
      imageURTVerNekko
    ],
    chainId,
    enabled: chainId === currentNetworkId,
  });

  return { writeAsync, isLoading };
};

export default useHatterHatMint;
