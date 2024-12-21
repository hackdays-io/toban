import { Box, Collapsible, Flex, Text } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useTreeInfo } from "hooks/useHats";
import { FC, useCallback, useState } from "react";
import { CommonButton } from "~/components/common/CommonButton";
import { FaAngleDown, FaRegCopy } from "react-icons/fa6";
import { UserIcon } from "~/components/icon/UserIcon";

const SplitInfoItem = () => {
  const dummyFromAddress = "0xabc89dsakdfasdfasdd123sdafsdfasdf";
  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => {
    setOpen(true);
  }, [setOpen]);

  const dummyRatioBreakdown = [
    { name: "Ryoma", address: "0x12344sdfasdfadfaweifsd", ratio: 0.2 },
    { name: "Taro", address: "0x12344sdfasdfadfaweifsd", ratio: 0.8 },
  ];

  return (
    <Collapsible.Root disabled={open} onOpenChange={onOpen}>
      <Collapsible.Trigger w="full" textAlign={"start"} cursor="pointer">
        <Flex mb={2}>
          <Text as="span" textStyle="xs">
            Optimism
          </Text>
        </Flex>
        <Text textStyle="md">2024Q3_Rewards</Text>
        <Text textStyle="sm">Created at 2024/7/11</Text>
        <Flex mt={4} placeItems="center">
          <Text textStyle="sm" flexGrow={1}>
            {dummyFromAddress}
          </Text>
          <CommonButton
            color="#333"
            background="transparent"
            w="auto"
            h="auto"
            p="4px"
            minW="unset"
          >
            <FaRegCopy
              style={{ width: "16px", height: "16px", objectFit: "cover" }}
            />
          </CommonButton>
        </Flex>
        {open || (
          <CommonButton color="#333" background="transparent" w="full" h="auto">
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
        {dummyRatioBreakdown.map((breakdown) => (
          <Flex key={breakdown.name} my={2} alignItems="center" gap={2}>
            <UserIcon size="40px" />
            <Box flexGrow={1}>
              <Text textStyle="sm">{breakdown.name}</Text>
              <Text textStyle="sm">{breakdown.address}</Text>
            </Box>
            {breakdown.ratio * 100} %
          </Flex>
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

const SplitsIndex: FC = () => {
  const { treeId } = useParams();

  treeId;
  // const tree = useTreeInfo(Number(treeId));

  return (
    <Box w="100%">
      <Flex my={4} placeItems="center">
        <Text fontSize="lg" flexGrow={1}>
          Splits
        </Text>
        <CommonButton w={"auto"} size="sm">
          Create New
        </CommonButton>
      </Flex>
      <Box px={4} py={4} borderRadius={8} border="1px solid #333">
        <SplitInfoItem />
      </Box>
    </Box>
  );
};

export default SplitsIndex;
