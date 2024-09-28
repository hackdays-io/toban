import { parseEther, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

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

export const getEthAddress = (secretKey: `0x${string}`) => {
	const account = privateKeyToAccount(secretKey);
	return account.address;
};
