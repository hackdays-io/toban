import { HATS_ABI, HATS_V1 } from '@hatsprotocol/sdk-v1-core';
import { Hex } from 'viem';
import { useReadContract } from 'wagmi';

const useIsAdmin = ({
  address,
  hatId,
  chainId,
}: {
  address: Hex | undefined;
  hatId?: Hex;
  chainId: number | undefined;
}) => {
  const { data: isAdmin } = useReadContract({
    address: HATS_V1,
    abi: HATS_ABI,
    chainId,
    functionName: 'isAdminOfHat',
    args: [address || '0x', hatId ? BigInt(hatId) : BigInt('0x')],
  });

  return isAdmin as boolean | undefined;
};

export default useIsAdmin;
