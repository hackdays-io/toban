import type { Split } from "@0xsplits/splits-sdk";
import {
  Box,
  Collapsible,
  Flex,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link, useParams } from "@remix-run/react";
import dayjs from "dayjs";
import { useCopyToClipboard } from "hooks/useCopyToClipboard";
import { useNamesByAddresses } from "hooks/useENS";
import { useSplitsCreatorRelatedSplits } from "hooks/useSplitsCreator";
import { currentChain, publicClient } from "hooks/useViem";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type MouseEvent, useEffect, useMemo } from "react";
import { type FC, useCallback, useState } from "react";
import { FaAngleDown, FaRegCopy } from "react-icons/fa6";
import { abbreviateAddress } from "utils/wallet";
import type { Address } from "viem";
import { StickyNav } from "~/components/StickyNav";
import { CommonButton } from "~/components/common/CommonButton";
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
            <Link
              target="_blank"
              to={`https://app.splits.org/accounts/${split.address}/?chainId=${currentChain.id}`}
            >
              <CommonButton size="xs" w="100" bgColor="blue.400">
                詳細を確認
              </CommonButton>
            </Link>
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

  const { data } = useGetWorkspace(treeId);

  const splitCreatorAddress = useMemo(() => {
    return data?.workspace?.splitCreator as Address;
  }, [data]);

  const { splits, isLoading } =
    useSplitsCreatorRelatedSplits(splitCreatorAddress);

  console.log(splits);

  const splitsAddress = useMemo(() => {
    return splits.map((split) => split.address);
  }, [splits]);
  const { names } = useNamesByAddresses(splitsAddress);

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
