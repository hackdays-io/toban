import { type ConnectedWallet, useWallets } from "@privy-io/react-auth";
import {
  type SmartWalletClientType,
  useSmartWallets,
} from "@privy-io/react-auth/smart-wallets";
import { useEffect, useMemo, useState } from "react";
import {
  type Account,
  type Address,
  type CustomTransport,
  type WalletClient,
  createWalletClient,
  custom,
} from "viem";
import { currentChain } from "./useViem";

export const useAccountClient = (wallets: ConnectedWallet[]) => {
  const [client, setClient] =
    useState<WalletClient<CustomTransport, typeof currentChain, Account>>();
  const [wallet, setWallet] = useState<ConnectedWallet>();

  useEffect(() => {
    const create = async () => {
      setClient(undefined);
      setWallet(undefined);

      if (!wallets[0]) return;
      const wallet = wallets[0];
      setWallet(wallet);

      const provider = await wallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: currentChain,
        transport: custom(provider),
        account: wallet.address as Address,
      });

      setClient(walletClient);
    };

    create();
  }, [wallets]);

  return { client, wallet };
};

export const useActiveWallet = () => {
  const { wallets } = useWallets();
  const { client: walletClient, wallet: connectedWallet } =
    useAccountClient(wallets);
  const { client: smartWalletClient } = useSmartWallets();

  const isConnectingEmbeddedWallet = useMemo(() => {
    return wallets.some((wallet) => wallet.connectorType === "embedded");
  }, [wallets]);

  const isSmartWallet = useMemo(() => {
    return !!smartWalletClient;
  }, [smartWalletClient]);

  const wallet = useMemo(() => {
    if (isConnectingEmbeddedWallet && !smartWalletClient) return;
    return smartWalletClient ? smartWalletClient : walletClient;
  }, [walletClient, smartWalletClient, isConnectingEmbeddedWallet]);

  // True while an embedded wallet is connected but its smart wallet client
  // hasn't been provisioned yet. Centralising the derivation here so
  // AccountMenu / login.tsx don't each re-derive it.
  const isPreparingSmartWallet = useMemo(
    () => isConnectingEmbeddedWallet && !smartWalletClient,
    [isConnectingEmbeddedWallet, smartWalletClient],
  );

  return {
    wallet,
    connectedWallet,
    isSmartWallet,
    isConnectingEmbeddedWallet,
    isPreparingSmartWallet,
  };
};

export type WalletType =
  | SmartWalletClientType
  | WalletClient<CustomTransport, typeof currentChain, Account>
  | undefined;
