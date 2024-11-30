import { useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { http } from "viem";
import { currentChain, publicClient } from "./useViem";
import { entryPoint07Address } from "viem/account-abstraction";
import { createSmartAccountClient, SmartAccountClient } from "permissionless";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { toSimpleSmartAccount } from "permissionless/accounts";

export const pimlicoUrl = `https://api.pimlico.io/v2/${
	currentChain.id
}/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`;

export const pimlicoClient = createPimlicoClient({
	transport: http(pimlicoUrl) as any,
	entryPoint: {
		address: entryPoint07Address,
		version: "0.7",
	},
});

export const useSmartAccountClient = () => {
	const [client, setClient] = useState<SmartAccountClient>();
	const { wallets } = useWallets();

	useEffect(() => {
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
