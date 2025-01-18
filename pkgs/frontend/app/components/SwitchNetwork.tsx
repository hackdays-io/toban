import { useWallets } from "@privy-io/react-auth";
import { currentChain, getChainById, supportedChains } from "hooks/useViem";
import { type FC, useEffect } from "react";
import type { Chain } from "viem";

export const useSwitchNetwork = () => {
  const { wallets } = useWallets();

  const switchToChain = async (targetChain: Chain) => {
    const connectedWallet = wallets[0];
    if (!connectedWallet) {
      throw new Error("ウォレットが接続されていません");
    }

    // チェーンがサポートされているか確認
    if (!supportedChains.some((chain) => chain.id === targetChain.id)) {
      throw new Error("サポートされていないチェーンです");
    }

    const currentChainId = Number(connectedWallet.chainId.split(":")[1]);

    if (currentChainId !== targetChain.id) {
      try {
        await connectedWallet.switchChain(targetChain.id);
        return true;
      } catch (error) {
        console.error("チェーンの切り替えに失敗しました:", error);
        throw error;
      }
    }
    return false;
  };

  return { switchToChain };
};

export const SwitchNetwork: FC = () => {
  const { wallets } = useWallets();
  const { switchToChain } = useSwitchNetwork();

  useEffect(() => {
    const initializeChain = async () => {
      // ウォレットが接続されているか確認
      if (!wallets.length) return;

      try {
        await switchToChain(currentChain);
      } catch (error) {
        console.error("初期チェーンの設定に失敗しました:", error);
      }
    };

    initializeChain();
  }, [switchToChain, wallets]); // walletsを依存配列に追加

  return <></>;
};
