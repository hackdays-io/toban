import {
	Address,
	decodeEventLog,
	formatEther,
	parseEther,
	PublicClient,
	WalletClient,
	zeroAddress,
    createWalletClient,
    http
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const signTx  = async (secretKey: `0x${string}`, to: `0x${string}`) => {
    const account = privateKeyToAccount(secretKey);

    const client = createWalletClient({
        account,
        chain: mainnet,
        transport: http()
    });
       
    const hash = await client.sendTransaction({
        account,
        to: to,
        value: parseEther('0.001')
    });

    return hash;
}