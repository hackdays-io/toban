import {useChainId} from "wagmi";

import useHatContractWrite, {ValidFunctionName} from "./useHatContractWrite";

export const useHatCreate = ({
  hatId,
  detailsURI,
  imageURI,
}: {
  hatId: bigint;
  detailsURI: string;
  imageURI: string;
}) => {
  const currentNetworkId = useChainId();

  /**
   * Hatをミントするメソッド
   */
  const {writeAsync, isLoading} = useHatContractWrite({
    functionName: "createHat" as ValidFunctionName,
    args: [
      hatId,
      detailsURI,
      10,
      "0x0000000000000000000000000000000000004a75",
      "0x0000000000000000000000000000000000004a75",
      true as any,
      imageURI,
    ],
    chainId: currentNetworkId,
    enabled: Boolean(hatId),
  });

  return {writeAsync, isLoading};
};
