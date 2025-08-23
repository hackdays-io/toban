import { useEffect, useMemo, useState } from "react";
import { thanksTokenBaseConfig } from "./useContracts";
import { useTreeInfo } from "./useHats";
import { publicClient } from "./useViem";
import { useActiveWallet } from "./useWallet";
import { useGetWorkspace } from "./useWorkspace";

export const useThanksToken = (treeId: string) => {
  const { data } = useGetWorkspace(treeId);
  const treeInfo = useTreeInfo(Number(treeId));
  const { wallet } = useActiveWallet();
  const [mintableAmount, setMintableAmount] = useState<bigint>();

  const walletAddress = wallet?.account.address?.toLowerCase();
  const myRoles = useMemo(() => {
    const roles = treeInfo?.hats || [];
    return (
      roles.filter((hat) => hat.wearers?.some((w) => w.id === walletAddress)) ||
      []
    );
  }, [treeInfo, walletAddress]);

  useEffect(() => {
    const fetchMintableAmount = async () => {
      if (!myRoles.length || !data?.workspace?.thanksToken.id) return;
      const relatedRole = myRoles.map((mr) => {
        return {
          hatId: BigInt(mr.id),
          wearer: walletAddress as `0x${string}`,
        };
      });

      const amount = await publicClient.readContract({
        ...thanksTokenBaseConfig(
          data?.workspace?.thanksToken.id as `0x${string}`,
        ),
        functionName: "mintableAmount",
        args: [walletAddress as `0x${string}`, relatedRole],
      });
      setMintableAmount(amount);
    };

    fetchMintableAmount();
  }, [myRoles, data, walletAddress]);

  return { mintableAmount };
};
