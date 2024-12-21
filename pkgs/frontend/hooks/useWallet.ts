import { ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { createSmartAccountClient, SmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Account,
  Address,
  createWalletClient,
  custom,
  CustomTransport,
  http,
  Transport,
  WalletClient,
} from "viem";
import {
  entryPoint07Address,
  SmartAccount,
  SmartAccountImplementation,
} from "viem/account-abstraction";
import { currentChain, publicClient } from "./useViem";

// Pimlico API endpoint URL
export const pimlicoUrl = `https://api.pimlico.io/v2/${
  currentChain.id
}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;

/**
 * Pimlico client
 */
export const pimlicoClient = createPimlicoClient({
  transport: http(pimlicoUrl) as any,
  entryPoint: {
    address: entryPoint07Address,
    version: "0.7",
  },
});

/**
 * Pimlico 向けの React Hooks
 */
export const useSmartAccountClient = (wallets: ConnectedWallet[]) => {
  const [client, setClient] =
    useState<
      SmartAccountClient<
        Transport,
        typeof currentChain,
        SmartAccount<SmartAccountImplementation>
      >
    >();

  useEffect(() => {
    /**
     * スマートウォレットクライアントインスタンスを作成する。
     * @returns
     */
    const create = async () => {
      setClient(undefined);
      const embeddedWallet = wallets.find(
        (wallet) => wallet.connectorType === "embedded"
      );
      const owner = await embeddedWallet?.getEthereumProvider();
      if (!owner) return;

      const smartAccount = await toSimpleSmartAccount({
        owner,
        client: publicClient as any,
        entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
        },
      });

      const smartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain: currentChain as any,
        bundlerTransport: http(pimlicoUrl) as any,
        paymaster: pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).standard;
          },
        },
      });

      setClient(smartAccountClient as any);
    };
    create();
  }, [wallets]);

  return client;
};

export const useAccountClient = (wallets: ConnectedWallet[]) => {
  const [client, setClient] =
    useState<WalletClient<CustomTransport, typeof currentChain, Account>>();

  useEffect(() => {
    const create = async () => {
      setClient(undefined);
      if (!wallets[0]) return;
      const wallet = wallets[0];

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

  return client;
};

export const useActiveWallet = () => {
  const { wallets } = useWallets();
  const walletClient = useAccountClient(wallets);
  const smartWalletClient = useSmartAccountClient(wallets);

  const isConnectingEmbeddedWallet = useMemo(() => {
    return wallets.some((wallet) => wallet.connectorType === "embedded");
  }, [wallets]);

  const isSmartWallet = useMemo(() => {
    return !!smartWalletClient;
  }, [smartWalletClient]);

  const wallet = useMemo(() => {
    return smartWalletClient ? smartWalletClient : walletClient;
  }, [walletClient, smartWalletClient]);

  return { wallet, isSmartWallet, isConnectingEmbeddedWallet };
};
