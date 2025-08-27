import type { Split } from "@0xsplits/splits-sdk";
import {
  Box,
  Collapsible,
  Flex,
  HStack,
  Heading,
  List,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link, useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useCopyToClipboard } from "hooks/useCopyToClipboard";
import { useNamesByAddresses } from "hooks/useENS";
import {
  useSplit,
  useSplitsCreatorRelatedSplits,
  useUserEarnings,
} from "hooks/useSplitsCreator";
import { publicClient } from "hooks/useViem";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import {
  type FC,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FaAngleDown, FaRegCopy } from "react-icons/fa6";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { StickyNav } from "~/components/StickyNav";
import { CommonButton } from "~/components/common/CommonButton";
import { SplitDetail } from "~/components/splits/SplitDetail";
import { SplitRecipientsList } from "~/components/splits/SplitRecipientsList";

interface SplitInfoItemProps {
  split: Split;
  name?: NameData;
}

const SplitInfoItem: FC<SplitInfoItemProps> = ({ split, name }) => {
  const [createdTime, setCreatedTime] = useState<string>();

  const consolidatedRecipients = useMemo(() => {
    let totalOwnership = 0;
    const consolidated = split.recipients.reduce(
      (acc, recipient) => {
        const address = recipient.recipient.address;
        acc[address] = (acc[address] || 0) + Number(recipient.ownership);
        totalOwnership += Number(recipient.ownership);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      list: Object.entries(consolidated).map(([address, ownership]) => ({
        address,
        ownership,
      })),
      totalOwnership,
    };
  }, [split.recipients]);

  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const { copyToClipboardAction } = useCopyToClipboard(split.address);

  const onClickCopyButton = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      copyToClipboardAction();
    },
    [copyToClipboardAction],
  );

  useEffect(() => {
    const fetch = async () => {
      const data = await publicClient.getBlock({
        blockNumber: BigInt(split.createdBlock),
      });

      setCreatedTime(
        dayjs(Number(data.timestamp) * 1000).format("YYYY/MM/DD HH:mm:ss"),
      );
    };
    fetch();
  }, [split]);

  const { splitEarnings, distribute, isDistributing } = useSplit(split.address);

  return (
    <Box
      w="100%"
      px={4}
      py={4}
      borderRadius={8}
      border="1px solid #333"
      bg="white"
    >
      <Collapsible.Root disabled={open} onOpenChange={onOpen}>
        <Collapsible.Trigger w="full" textAlign={"start"} cursor="pointer">
          <Flex alignItems="center" justifyContent="space-between">
            <Text textStyle="md">
              {name?.name
                ? `${name.name}.${name.domain}`
                : abbreviateAddress(split.address)}
            </Text>
            <SplitDetail
              splitAddress={split.address}
              splitEarnings={splitEarnings.data}
              distribute={distribute}
              isDistributing={isDistributing}
            />
          </Flex>
          <Text textStyle="sm">Created at {createdTime}</Text>
          <Flex mt={4} placeItems="center">
            <Text textStyle="sm" flexGrow={1} wordBreak="break-all">
              {split.address}
            </Text>
            <CommonButton
              color="#333"
              background="transparent"
              w="auto"
              h="auto"
              p="4px"
              minW="unset"
              onClick={onClickCopyButton}
            >
              <FaRegCopy
                style={{ width: "16px", height: "16px", objectFit: "cover" }}
              />
            </CommonButton>
          </Flex>

          {open || (
            <CommonButton
              color="#333"
              background="transparent"
              w="full"
              h="auto"
            >
              <FaAngleDown
                style={{ width: "16px", height: "16px", objectFit: "cover" }}
              />
            </CommonButton>
          )}
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Box
            mx={2}
            my={4}
            borderTop="1px solid #868e96"
            role="presentation"
          />
          <SplitRecipientsList recipients={consolidatedRecipients} />
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

const SplitsIndex: FC = () => {
  const { treeId } = useParams();

  const { data } = useGetWorkspace({ workspaceId: treeId || "" });

  const splitCreatorAddress = useMemo(() => {
    return data?.workspace?.splitCreator as Address;
  }, [data]);

  const { splits, isLoading } =
    useSplitsCreatorRelatedSplits(splitCreatorAddress);

  const splitsAddress = useMemo(() => {
    return splits.map((split) => split.address);
  }, [splits]);
  const { names } = useNamesByAddresses(splitsAddress);

  const { userEarnings, withdraw, isWithdrawing } = useUserEarnings();
  const activeBalances = useMemo(() => {
    if (!userEarnings.data) return [];
    return Object.entries(userEarnings.data?.activeBalances || {}).map(
      ([address, balance]) => {
        return { address, balance };
      },
    );
  }, [userEarnings]);

  return (
    <>
      <Box w="100%">
        <Flex mb={4} placeItems="center">
          <Heading flexGrow={1} pb={4}>
            Splits
          </Heading>
          <Link to={`/${treeId}/splits/new`}>
            <CommonButton w={"auto"} size="sm">
              Create New
            </CommonButton>
          </Link>
        </Flex>

        {activeBalances.length > 0 && (
          <Box p={3} bg="red.100" borderRadius={8} mb={4}>
            <Heading fontSize="md">未回収の報酬があります</Heading>

            <List.Root listStyle="none">
              {activeBalances.map((balance) => {
                return (
                  <List.Item key={balance.address} mb={2}>
                    <HStack justifyContent="space-between">
                      <Text fontSize="md">
                        {Number(balance.balance.formattedAmount).toFixed(4)}...{" "}
                        {balance.balance.symbol}
                      </Text>
                      <CommonButton
                        size="xs"
                        w="100"
                        onClick={() => {
                          withdraw(balance.address as Address);
                        }}
                        loading={isWithdrawing}
                      >
                        引き出す
                      </CommonButton>
                    </HStack>
                  </List.Item>
                );
              })}
            </List.Root>
          </Box>
        )}

        {isLoading ? (
          <></>
        ) : (
          <VStack gap={3} mb={10}>
            {splits
              .slice()
              .sort((a, b) => Number(b.createdBlock) - Number(a.createdBlock))
              .map((split) => (
                <SplitInfoItem
                  key={split.address}
                  split={split}
                  name={
                    names.find((name) =>
                      name.some(
                        (n) =>
                          n.address.toLowerCase() ===
                          split.address.toLowerCase(),
                      ),
                    )?.[0]
                  }
                />
              ))}
          </VStack>
        )}
      </Box>
      <StickyNav />
    </>
  );
};

export default SplitsIndex;
