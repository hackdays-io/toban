import { useEffect, useMemo, type MouseEvent } from "react";
import { Box, Collapsible, Flex, Text, VStack } from "@chakra-ui/react";
import { Link, useParams } from "@remix-run/react";
import { FC, useCallback, useState } from "react";
import { CommonButton } from "~/components/common/CommonButton";
import { FaAngleDown, FaRegCopy } from "react-icons/fa6";
import { UserIcon } from "~/components/icon/UserIcon";
import { useCopyToClipboard } from "hooks/useCopyToClipboard";
import { useGetWorkspace } from "hooks/useWorkspace";
import { useSplitsCreatorRelatedSplits } from "hooks/useSplitsCreator";
import { Address } from "viem";
import { Split } from "@0xsplits/splits-sdk";
import { abbreviateAddress } from "utils/wallet";
import { publicClient } from "hooks/useViem";
import dayjs from "dayjs";
import { useNamesByAddresses } from "hooks/useENS";
import { ipfs2https } from "utils/ipfs";

interface SplitInfoItemProps {
  split: Split;
}

const SplitInfoItem: FC<SplitInfoItemProps> = ({ split }) => {
  const [createdTime, setCreatedTime] = useState<string>();

  const addresses = useMemo(() => {
    return split.recipients.map((r) => r.recipient.address);
  }, [split]);
  const { names } = useNamesByAddresses(addresses);

  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const { copyToClipboardAction } = useCopyToClipboard(split.address);

  const onClickCopyButton = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      copyToClipboardAction();
    },
    [copyToClipboardAction]
  );

  const totalAllocation = useMemo(() => {
    return split.recipients.reduce((acc, recipient) => {
      return acc + Number(recipient.percentAllocation);
    }, 0);
  }, [split]);

  useEffect(() => {
    const fetch = async () => {
      const data = await publicClient.getBlock({
        blockNumber: BigInt(split.createdBlock),
      });

      setCreatedTime(
        dayjs(Number(data.timestamp) * 1000).format("YYYY/MM/DD HH:mm:ss")
      );
    };
    fetch();
  }, [split]);

  return (
    <Box w="100%" px={4} py={4} borderRadius={8} border="1px solid #333">
      <Collapsible.Root disabled={open} onOpenChange={onOpen}>
        <Collapsible.Trigger w="full" textAlign={"start"} cursor="pointer">
          <Text textStyle="md">{abbreviateAddress(split.address)}</Text>
          <Text textStyle="sm">Created at {createdTime}</Text>
          <Flex mt={4} placeItems="center">
            <Text textStyle="sm" flexGrow={1}>
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
          ></Box>
          {names.map((name) => (
            <Flex
              key={name[0]?.address + split.address}
              my={2}
              alignItems="center"
              gap={2}
            >
              <UserIcon
                size="40px"
                userImageUrl={ipfs2https(name[0]?.text_records?.avatar)}
              />
              <Box flexGrow={1}>
                <Text textStyle="sm">{name[0]?.name}</Text>
                <Text textStyle="sm">
                  {abbreviateAddress(name[0]?.address || "")}
                </Text>
              </Box>
              {(Number(
                split.recipients.find(
                  (recipient) =>
                    recipient.recipient.address.toLowerCase() ===
                    name[0]?.address.toLowerCase()
                )?.percentAllocation
              ) /
                totalAllocation) *
                100}{" "}
              %
            </Flex>
          ))}
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

  return (
    <Box w="100%">
      <Flex my={4} placeItems="center">
        <Text fontSize="lg" flexGrow={1}>
          Splits
        </Text>
        <Link to={`/${treeId}/splits/new`}>
          <CommonButton w={"auto"} size="sm">
            Create New
          </CommonButton>
        </Link>
      </Flex>

      {isLoading ? (
        <></>
      ) : (
        <VStack gap={3}>
          {splits.map((split) => (
            <SplitInfoItem key={split.address} split={split} />
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default SplitsIndex;
