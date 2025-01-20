import { type ConnectedWallet, useWallets } from "@privy-io/react-auth";
import {
  type SmartAccountClient,
  createSmartAccountClient,
} from "permissionless";
import { toThirdwebSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { useEffect, useMemo, useState } from "react";
import {
  http,
  type Account,
  type Address,
  type CustomTransport,
  type Transport,
  type WalletClient,
  createWalletClient,
  custom,
} from "viem";
import {
  type SmartAccount,
  type SmartAccountImplementation,
  entryPoint07Address,
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
  transport: http(pimlicoUrl),
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
        (wallet) => wallet.connectorType === "embedded",
      );
      const owner = await embeddedWallet?.getEthereumProvider();
      if (!owner) return;

      // We are using thirdweb smart account
      const smartAccount = await toThirdwebSmartAccount({
        owner,
        client: publicClient,
        entryPoint: {
          address: entryPoint07Address,
          version: "0.7",
        },
      });

      const smartAccountClient = createSmartAccountClient({
        account: smartAccount,
        chain: currentChain,
        bundlerTransport: http(pimlicoUrl),
        paymaster: pimlicoClient,
        userOperation: {
          estimateFeesPerGas: async () => {
            return (await pimlicoClient.getUserOperationGasPrice()).standard;
          },
        },
      });

      setClient(smartAccountClient);
    };
    create();
  }, [wallets]);

  return client;
};

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
  const smartWalletClient = useSmartAccountClient(wallets);

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

  return { wallet, connectedWallet, isSmartWallet, isConnectingEmbeddedWallet };
};
