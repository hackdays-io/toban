import { currentChain } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useEffect } from "react";

export const SwitchNetwork: FC = () => {
  const { connectedWallet } = useActiveWallet();

  useEffect(() => {
    const switchChain = async () => {
      if (
        connectedWallet &&
        Number(connectedWallet.chainId) !== currentChain.id
      ) {
        await connectedWallet.switchChain(currentChain.id);
      }
    };

    switchChain();
  }, [connectedWallet]);

  return <></>;
};
