import { useWallets } from "@privy-io/react-auth";
import { createSmartAccountClient, SmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { useEffect, useState } from "react";
import { http } from "viem";
import { entryPoint07Address } from "viem/account-abstraction";
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
export const useSmartAccountClient = () => {
  const [client, setClient] = useState<SmartAccountClient>();
  const { wallets } = useWallets();

  useEffect(() => {
    /**
     * スマートウォレットクライアントインスタンスを作成する。
     * @returns
     */
    const create = async () => {
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

      setClient(smartAccountClient);
    };
    create();
  }, [wallets]);

  return client;
};
