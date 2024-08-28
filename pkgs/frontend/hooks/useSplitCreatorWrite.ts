import {HATS_ABI, HATS_V1} from "@hatsprotocol/sdk-v1-core";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {toast} from "sonner";
import {TransactionReceipt, decodeEventLog} from "viem";
import {useChainId, useWriteContract} from "wagmi";
import {waitForTransactionReceipt} from "wagmi/actions";

import {wagmiConfig} from "@/lib/web3";
import {SplitCreatorABI} from "@/utils/abis/SplitCreator";
import {SPLIT_CREATOR_CONTRACT_ADDRESS} from "@/lib/constants";

type ExtractFunctionNames<ABI> = ABI extends {
  name: infer N;
  type: "function";
}[]
  ? N
  : never;

export type ValidFunctionName = ExtractFunctionNames<typeof SplitCreatorABI>;

interface ContractInteractionProps<T extends ValidFunctionName> {
  functionName: T;
  args?: (string | number | bigint)[];
  value?: any;
  chainId?: number;
  onSuccessToastData?: {title: string; description?: string};
  txDescription?: string;
  onErrorToastData?: {title: string; description?: string};
  queryKeys?: (object | string | number)[][];
  transactionTimeout?: number;
  enabled: boolean;
  handleSuccess?: (data?: TransactionReceipt) => void; // passed with handlePendingTx
  waitForSubgraph?: (data?: TransactionReceipt) => void; // passed with handleSuccess
}

const useSplitCreatorWrite = <T extends ValidFunctionName>({
  functionName,
  args,
  chainId,
  onErrorToastData,
  enabled,
}: ContractInteractionProps<T>) => {
  const userChainId = useChainId();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const {writeContractAsync} = useWriteContract();

  const handleHatWrite = async () => {
    if (!enabled || !chainId || userChainId !== chainId) return null;
    setIsLoading(true);

    // @ts-expect-error - not totally sure what is wrong with the union type here
    return writeContractAsync({
      address: SPLIT_CREATOR_CONTRACT_ADDRESS,
      chainId: Number(chainId),
      abi: SplitCreatorABI,
      functionName,
      args,
    })
      .then(async (hash) => {
        toast.info("Waiting for your transaction to be accepted...");

        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          chainId: chainId as any,
          hash,
        });

        const decodedLogs = receipt.logs.map((log) => {
          return decodeEventLog({
            abi: SplitCreatorABI,
            data: log.data,
            topics: log.topics,
          });
        });
        toast.info("Transaction submitted");
        return decodedLogs;
      })
      .catch((error) => {
        console.log("Error!!", error);
        if (
          error.name === "TransactionExecutionError" &&
          error.message.includes("User rejected the request")
        ) {
          console.log({
            title: "Signature rejected!",
            description: "Please accept the transaction in your wallet",
          });
          toast.error("Please accept the transaction in your wallet.");
        } else {
          console.log({
            title: "Error occurred!",
            description:
              onErrorToastData?.description ??
              "An error occurred while processing the transaction.",
          });
          toast.error("An error occurred while processing the transaction.");
        }
      });
  };

  return {
    writeAsync: handleHatWrite,
    isLoading,
  };
};

export default useSplitCreatorWrite;
