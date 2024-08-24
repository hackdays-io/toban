import {useAccount, useChainId} from "wagmi";
import useHatContractWrite, {ValidFunctionName} from "./useHatContractWrite";

const useTopHatMint = ({
  chainId,
  details,
  imageURI,
}: {
  chainId: number;
  details: string;
  imageURI: string;
}) => {
  // const walletClient: any = await getWalletClient(wagmiConfig);
  const {address} = useAccount();
  const currentNetworkId = useChainId();

  /**
   * TopHatをMintするメソッド
   */
  const {writeAsync, isLoading} = useHatContractWrite({
    functionName: "mintTopHat" as ValidFunctionName,
    args: [address!, details, imageURI],
    chainId,
    enabled: chainId === currentNetworkId,
  });

  return {writeAsync, isLoading};
};

export default useTopHatMint;
