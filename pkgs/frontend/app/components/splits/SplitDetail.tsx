import type { FormattedContractEarnings } from "@0xsplits/splits-sdk";
import {
  Box,
  HStack,
  Heading,
  List,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link } from "@remix-run/react";
import { currentChain } from "hooks/useViem";
import { type FC, useMemo } from "react";
import type { Address } from "viem";
import CommonButton from "../common/CommonButton";
import { CommonDialog } from "../common/CommonDialog";

interface Props {
  splitAddress: Address;
  splitEarnings?: FormattedContractEarnings;
  distribute: (tokenAddress: Address) => Promise<void>;
  isDistributing: boolean;
}

export const SplitDetail: FC<Props> = ({
  splitAddress,
  splitEarnings,
  distribute,
  isDistributing,
}) => {
  const activeBalances = useMemo(() => {
    return Object.entries(splitEarnings?.activeBalances || {}).map(
      ([address, balance]) => {
        return { address, balance };
      },
    );
  }, [splitEarnings]);

  const distributedBalances = useMemo(() => {
    return Object.entries(splitEarnings?.distributed || {}).map(
      ([address, balance]) => {
        return { address, balance };
      },
    );
  }, [splitEarnings]);

  return (
    <CommonDialog
      dialogTriggerReactNode={
        <CommonButton size="xs" w="100" bgColor="blue.400">
          詳細を確認
        </CommonButton>
      }
    >
      <Box p={4}>
        <Heading fontSize="md">未分配のトークン</Heading>
        <List.Root listStyle="none">
          {activeBalances.map((balance) => {
            return (
              <List.Item key={balance.address} mb={2}>
                <HStack justifyContent="space-between">
                  <Text fontSize="md">
                    {balance.balance.formattedAmount} {balance.balance.symbol}
                  </Text>
                  <CommonButton
                    size="xs"
                    w="100"
                    onClick={() => {
                      distribute(balance.address as Address);
                    }}
                    loading={isDistributing}
                  >
                    分配
                  </CommonButton>
                </HStack>
              </List.Item>
            );
          })}
        </List.Root>

        <Heading fontSize="md" mt={4}>
          分配済みのトークン
        </Heading>

        <List.Root listStyle="none">
          {distributedBalances.map((balance) => {
            return (
              <List.Item key={balance.address}>
                <Text>
                  {balance.balance.formattedAmount} {balance.balance.symbol}
                </Text>
              </List.Item>
            );
          })}
        </List.Root>

        <Stack mt={6} gap={3}>
          <Link
            target="_blank"
            to={`https://app.splits.org/accounts/${splitAddress}/?chainId=${currentChain.id}`}
          >
            <CommonButton backgroundColor="blue.300">
              Splitページ(外部)
            </CommonButton>
          </Link>
        </Stack>
      </Box>
    </CommonDialog>
  );
};
