import { type ConnectedWallet, useWallets } from "@privy-io/react-auth";
import {
  type SmartAccountClient,
  createSmartAccountClient,
} from "permissionless";
import { toThirdwebSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { useEffect, useMemo, useState } from "react";
import {
  Hex,
  http,
  zeroAddress,
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
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
import { odysseyTestnet } from "viem/chains";
import { safeAbiImplementation } from "./safeAbi";
import { getSafeModuleSetupData } from "./setupData";


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

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const owner = (await embeddedWallet?.getEthereumProvider()) as any;
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

      // 7702デモ用のEOAアカウントを作成する
      const eoaPrivateKey = import.meta.env.VITE_EOA_PRIVATE_KEY as Hex;
      if (!eoaPrivateKey) throw new Error("EOA_PRIVATE_KEY is required");

      const account = privateKeyToAccount(eoaPrivateKey);

      const walletClient2 = createWalletClient({
        account,
        chain: odysseyTestnet,
        transport: http("https://odyssey.ithaca.xyz"),
      });

      console.log('walletClient2', walletClient2);

      // const SAFE_SINGLETON_ADDRESS = "0x41675C099F32341bf84BFc5382aF534df5C7461a";
      // const authorization = await walletClient.signAuthorization({
      //   contractAddress: SAFE_SINGLETON_ADDRESS,
      // });

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

export type WalletType =
  | SmartAccountClient<
      Transport,
      typeof currentChain,
      SmartAccount<SmartAccountImplementation>
    >
  | WalletClient<CustomTransport, typeof currentChain, Account>
  | undefined;
