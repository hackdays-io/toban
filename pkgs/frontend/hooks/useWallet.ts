import { ConnectedWallet, useWallets } from "@privy-io/react-auth";
import { createSmartAccountClient, SmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { useEffect, useMemo, useState } from "react";
import { http } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { currentChain, publicClient } from "./useViem";

const PIMLICO_API_KEY = import.meta.env.VITE_PIMLICO_API_KEY as string;
// Pimlico API endpoint URL
export const pimlicoUrl = `https://api.pimlico.io/v2/${
  currentChain.id
}/rpc?apikey=${PIMLICO_API_KEY}`;

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
export const useSmartAccountClient = () => {
  const [_wallets, setWallets] = useState<ConnectedWallet[] | undefined>(
    undefined
  );
  const [client, setClient] = useState<SmartAccountClient>();
  // @help walletsがやたらレンダリングされる
  const { wallets } = useWallets();
  const walletsMemo = useMemo(() => {
    if (wallets && wallets.length !== 0) {
      console.log("=== walletsMemo ===", wallets);
      return wallets;
    }
  }, [wallets]);
  console.log("useSmartAccountClient");

  useEffect(() => {
    if (walletsMemo && walletsMemo.length !== 0 && walletsMemo !== _wallets) {
      console.log("=== setWallets ===");
      setWallets(walletsMemo);
    }
  }, [walletsMemo]);

  useEffect(() => {
    /**
     * スマートウォレットクライアントインスタンスを作成する。
     * @returns
     */
    const create = async () => {
      console.log("=== create ===", _wallets);

      const embeddedWallet = _wallets?.find(
        (wallet) => wallet.connectorType === "embedded"
      );
      if (!embeddedWallet) return;

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

      if (smartAccountClient !== client) {
        console.log("=== setClient ===", smartAccountClient);
        setClient(smartAccountClient);
      }
    };

    if (_wallets && _wallets.length !== 0) {
      create();
    }
  }, [_wallets]);

  return client;
};

export const useActiveWallet = () => {
  const { wallets } = useWallets();
  const [_wallets, setWallets] = useState<ConnectedWallet[] | undefined>(
    undefined
  );

  const walletsMemo = useMemo(() => {
    if (wallets && wallets.length !== 0) {
      console.log("=== walletsMemo ===", wallets);
      return wallets;
    }
  }, [wallets]);
  console.log("useSmartAccountClient");

  useEffect(() => {
    if (walletsMemo && walletsMemo.length !== 0 && walletsMemo !== _wallets) {
      console.log("=== setWallets ===");
      setWallets(walletsMemo);
    }
  }, [walletsMemo]);

  const smartWallet = useSmartAccountClient();

  const wallet = useMemo(() => {
    return _wallets && _wallets[0];
  }, [_wallets]);

  const isSmartWallet = useMemo(() => {
    return smartWallet ? true : false;
  }, [smartWallet]);

  const preferredAddress = useMemo(() => {
    if (smartWallet) {
      return smartWallet.account?.address;
    } else if (wallet) {
      return wallet.address;
    }
  }, [smartWallet, wallet]);

  return { wallet, smartWallet, isSmartWallet, preferredAddress };
};
