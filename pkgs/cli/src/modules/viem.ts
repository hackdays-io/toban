import {
	Chain,
	createWalletClient,
	http,
	parseEther,
	PrivateKeyAccount,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat, sepolia, holesky } from "viem/chains";

const chains = [hardhat, sepolia, holesky];

function getChainById(chainId: number | string): Chain {
	const numericChainId = Number(chainId);

	const chain = chains.find((c) => c.id === numericChainId);

	if (!chain) {
		throw new Error(`Chain with id ${numericChainId} not found`);
	}

	return chain;
}

export const setClient = async (
	account: PrivateKeyAccount,
	chainId?: number | undefined
) => {
	const chain = chainId ? getChainById(chainId) : holesky;

	const client = createWalletClient({
		account,
		chain,
		transport: http(),
	});

	return client;
};

export const sendEth = async (
	account: PrivateKeyAccount,
	to: `0x${string}`,
	amount: string,
	chainId?: number
) => {
	const client = await setClient(account, chainId);

	const hash = await client.sendTransaction({
		account,
		to: to,
		value: parseEther(amount),
	});

	console.log(`Transaction sent: ${hash}`);
	console.log(`From: ${account.address}`);
	console.log(`To: ${to}`);
	console.log(`Amount: ${amount} ETH`);
	console.log(`Chain ID: ${client.chain.id}`);

	return hash;
};

/**
 * ETHアドレスを取得するためのメソッド
 * @param secretKey
 * @returns
 */
export const getEthAddress = (secretKey: `0x${string}`) => {
	const account = privateKeyToAccount(secretKey);
	return account.address;
};
