import {
  http,
  type Chain,
  type PrivateKeyAccount,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat, holesky, sepolia } from "viem/chains";

const chains = [hardhat, holesky, sepolia];

export const getChainById = (chainId: number | string): Chain => {
  const numericChainId = Number(chainId);

  const chain = chains.find((c) => c.id === numericChainId);

  if (!chain) {
    throw new Error(`Chain with id ${numericChainId} not found`);
  }

  return chain;
};

export const getChainOrDefault = (
  chainId: number | string | undefined,
): Chain => {
  return chainId ? getChainById(chainId) : sepolia;
};

export const getPublicClient = async (chainId?: number | undefined) => {
  const chain = getChainOrDefault(chainId);

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  return publicClient;
};

export const setWallet = async (
  account: PrivateKeyAccount,
  chainId?: number | undefined,
) => {
  const chain = getChainOrDefault(chainId);

  const wallet = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  return wallet;
};

export const sendEth = async (
  wallet: WalletClient,
  to: `0x${string}`,
  amount: string,
) => {
  const account = wallet.account;

  if (!account) {
    throw new Error("Client account is not defined");
  }

  const hash = await wallet.sendTransaction({
    account,
    to,
    value: parseEther(amount),
    chain: wallet.chain,
  });

  console.log(`Transaction sent: ${hash}`);
  console.log(`From: ${account.address}`);
  console.log(`To: ${to}`);
  console.log(`Amount: ${amount} ETH`);
  console.log(`Chain ID: ${wallet.chain?.id}`);

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
