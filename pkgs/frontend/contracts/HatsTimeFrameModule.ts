import { Address, WalletClient, TransactionReceipt } from "viem";
import { HATS_TIME_FRAME_MODULE_ABI } from "../abi/hatsTimeFrameModule";
import { sepolia, optimism, base, mainnet } from "viem/chains";
import { startLoading } from "../../cli/src/services/loading";

const CONTRACT_ADDRESSES: Record<number, `0x${string}`> = {
  [sepolia.id]: "0xYourSepoliaContractAddressHere",
  [optimism.id]: "0xYourOptimismContractAddressHere",
  [base.id]: "0xYourBaseContractAddressHere",
  [mainnet.id]: "0xYourMainnetContractAddressHere",
};

interface MintHatParams {
  chainId: number;
  hatId: bigint;
  wearer: Address;
  walletClient: WalletClient; // send transactions
}

/**
 * Sends a transaction to the HatsTimeFrameModule contract to mint a Hat for a specified wearer.
 * @param params - Includes chainId, hatId, wearer address, and a walletClient for sending the transaction.
 * @returns Transaction hash if the transaction is sent successfully, otherwise throws an error.
 */
export const mintHat = async ({
  chainId,
  hatId,
  wearer,
  walletClient,
}: MintHatParams): Promise<string | null> => {
  const contractAddress = CONTRACT_ADDRESSES[chainId];
  if (!contractAddress) {
    throw new Error(`Contract address not defined for chain ID: ${chainId}`);
  }

  try {
    // Execute the `mintHat` function on the HatsTimeFrameModule contract.
    // `walletClient.writeContract` encodes the function call using the ABI, function name, and args.
    const transactionHash = await walletClient.writeContract({
      address: contractAddress,
      abi: HATS_TIME_FRAME_MODULE_ABI,
      functionName: "mintHat",
      args: [hatId, wearer],
    });

    console.log(`Transaction sent with hash: ${transactionHash}`);
    return transactionHash;
  } catch (error: any) {
    console.error("Error minting Hat:", error);
    throw new Error(
      error?.message || "An unexpected error occurred while minting the Hat."
    );
  }
};

/**
 * Waits for the transaction receipt to confirm whether the transaction succeeded.
 * @param walletClient - The wallet client used to send the transaction.
 * @param hash - The transaction hash returned by `mintHat`.
 * @returns A TransactionReceipt if confirmed, or throws an error if it fails or times out.
 */
const waitForTransactionReceipt = async (
  walletClient: WalletClient,
  hash: string
): Promise<TransactionReceipt> => {
  try {
    const receipt = await walletClient.waitForTransactionReceipt({ hash });
    return receipt;
  } catch (error: any) {
    console.error("Error waiting for transaction receipt:", error);
    throw new Error(error?.message || "Failed to get transaction receipt.");
  }
};

/**
 * Optionally mints a Hat and waits for confirmation that the transaction succeeded.
 * Displays a loading indicator during the process for better user feedback.
 * @param params - Same parameters as `mintHat`.
 * @returns The TransactionReceipt if the transaction is successful, or `null` if it fails.
 */
export const mintHatWithConfirmation = async (
  params: MintHatParams
): Promise<TransactionReceipt | null> => {
  const stop = startLoading();

  try {
    const txHash = await mintHat(params);
    if (!txHash) {
      throw new Error("Failed to retrieve transaction hash.");
    }

    const receipt = await waitForTransactionReceipt(
      params.walletClient,
      txHash
    );

    if (receipt.status === 1) {
      console.log("Transaction confirmed:", receipt);
      return receipt;
    } else {
      console.error("Transaction failed:", receipt);
      return null;
    }
  } catch (error: any) {
    console.error("Error during mintHatWithConfirmation:", error);
    throw new Error(
      error?.message ||
        "An unexpected error occurred during the Hat minting process."
    );
  } finally {
    stop();
  }
};
