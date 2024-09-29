import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

/**
 * ETHを送金するためのメソッド
 * @param secretKey
 * @param to
 * @returns
 */
export const sendEth = async (secretKey: `0x${string}`, to: `0x${string}`) => {
	const account = privateKeyToAccount(secretKey);

	const client = createWalletClient({
		account,
		chain: hardhat,
		transport: http(),
	});

	const hash = await client.sendTransaction({
		account,
		to: to,
		value: parseEther("0.001"),
	});

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
