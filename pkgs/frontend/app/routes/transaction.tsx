import {
  Box,
  Grid,
  GridItem,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { ERC20_ABI } from "abi/erc20";
import { publicClient } from "hooks/useViem";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useState } from "react";
import { toast } from "react-toastify";
import { parseEther } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { PageHeader } from "~/components/PageHeader";
import { CommonInput } from "~/components/common/CommonInput";
import { SettingsSubSection } from "./$treeId_.settings";

// Select tx types
const transactionTypes = createListCollection({
  items: [
    { label: "ERC20 Token", value: "ERC20" },
    { label: "Native Token", value: "Native" },
  ],
});

/**
 * Transaction Page Component
 * @returns
 */
const Transaction: FC = () => {
  const { wallet } = useActiveWallet();

  const [transactionType, setTransactionType] = useState("ERC20");
  const [contractAddress, setContractAddress] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * handleTransactionExecution function
   * トランザクションを実行する
   */
  const handleTransactionExecution = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }

    setIsLoading(true);
    try {
      // Native か ERC20トークンかで処理を分岐する。
      if (transactionType === "ERC20") {
        if (!contractAddress || !recipient || !amount) {
          alert("全ての項目を入力してください。");
          throw new Error("All fields are required.");
        }

        // get decimals of ERC20 token
        const decimals = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        });
        console.log("decimals:", decimals);

        // decimalを考慮してamountを計算
        const amountWithDecimals =
          BigInt(amount) * BigInt(10 ** Number(decimals));
        console.log("amountWithDecimals:", amountWithDecimals);

        // トランザクション実行処理(transfer)
        const transferTxHash = await wallet.writeContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipient as `0x${string}`, amountWithDecimals],
        });
        console.log("transferTxHash:", transferTxHash);

        await publicClient.waitForTransactionReceipt({
          hash: transferTxHash,
        });

        toast.success("トランザクションが正常に実行されました。");
      } else {
        if (!recipient || !amount) {
          alert("全ての項目を入力してください。");
          throw new Error("All fields are required.");
        }

        // Native Tokenを送金する
        //@ts-expect-error: Type 'string' is not assignable to type 'number | bigint'
        const txHash = await wallet.sendTransaction({
          to: recipient as `0x${string}`,
          value: parseEther(amount),
        });
        console.log("txHash:", txHash);
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
        });
      }
      toast.success("トランザクションが正常に実行されました。");
    } catch (error) {
      console.error("Transaction execution error:", error);
      toast.error("エラーが発生しました。");
    }
    setIsLoading(false);
  };

  return (
    <Grid gridTemplateRows="1fr auto" h="calc(100vh - 72px)">
      <Box w="100%">
        <PageHeader title="トランザクション実行" />

        <SettingsSubSection headingText="トランザクションタイプ">
          <SelectRoot
            collection={transactionTypes}
            onValueChange={(e) => setTransactionType(e.value[0])}
            size="sm"
            width="full"
            borderColor="gray.800"
            borderRadius="xl"
            backgroundColor="white"
            mt={2}
          >
            <SelectTrigger>
              <SelectValueText placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {transactionTypes.items.map((item) => (
                <SelectItem item={item} key={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        </SettingsSubSection>

        {transactionType === "ERC20" && (
          <SettingsSubSection headingText="コントラクトアドレス">
            <CommonInput
              placeholder="0x1234..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              mt={2}
            />
          </SettingsSubSection>
        )}

        <SettingsSubSection headingText="パラメータ">
          <Grid templateColumns="repeat(4, 1fr)" gap="6">
            <GridItem colSpan={1}>
              <Text mt={4}>recipient</Text>
            </GridItem>
            <GridItem colSpan={3}>
              <CommonInput
                placeholder="Recipient Address"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                mt={2}
              />
            </GridItem>
          </Grid>

          <Grid templateColumns="repeat(4, 1fr)" gap="6">
            <GridItem colSpan={1}>
              <Text mt={4}>amount</Text>
            </GridItem>
            <GridItem colSpan={3}>
              <CommonInput
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                mt={2}
              />
            </GridItem>
          </Grid>
        </SettingsSubSection>

        <BasicButton
          loading={isLoading}
          width="full"
          mt={6}
          onClick={handleTransactionExecution}
        >
          実行
        </BasicButton>
      </Box>
    </Grid>
  );
};

export default Transaction;
