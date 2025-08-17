import { Box, Flex, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useTreeInfo } from "hooks/useHats";
import { useUserThanksTokenBalance } from "hooks/useThanksToken";
import { useActiveWallet } from "hooks/useWallet";
import type { FC } from "react";
import { FaPlus } from "react-icons/fa6";
import { StickyNav } from "~/components/StickyNav";
import { CommonButton } from "~/components/common/CommonButton";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { MyRole } from "~/components/roles/MyRole";
import { VRole } from "~/components/roles/VRole";
import { ThanksTokenHistory } from "~/components/thankstoken/History";

const WorkspaceTop: FC = () => {
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const { treeId } = useParams();
  const tree = useTreeInfo(Number(treeId));

  return (
    <>
      {/* Thanks Token summary */}
      <Box my={4}>
        <Heading pb={3}>サンクストークン</Heading>
        {/* If you have a total received value, pass it as receivedTotal */}
        <ThanksTokenSummary treeId={treeId} /* receivedTotal={514230} */ />
      </Box>

      {/* Recent activity */}
      <Box my={4}>
        <HStack justify="space-between" alignItems="center" pb={4}>
          <Heading fontSize="xl">直近のアクティビティ</Heading>
          <Link to={`/${treeId}/thankstoken/history`}>
            <CommonButton size="xs" bgColor="green.400">
              もっと見る
            </CommonButton>
          </Link>
        </HStack>
        {treeId && <ThanksTokenHistory limit={3} treeId={treeId} />}
      </Box>

      {/* My roles */}
      <Box my={4}>
        <Heading py={4}>担当当番</Heading>
        <VStack gap={3} align="stretch">
          {tree?.hats
            ?.filter((h) => Number(h.levelAtLocalTree) >= 2)
            .filter((h) => h.wearers?.some((w) => w.id === me?.toLowerCase()))
            .map((h) => (
              <HatsListItemParser
                key={h.id}
                imageUri={h.imageUri}
                detailUri={h.details}
              >
                <MyRole address={me} treeId={treeId} hatId={h.id} />
              </HatsListItemParser>
            ))}
        </VStack>
      </Box>

      <StickyNav />
    </>
  );
};

export default WorkspaceTop;

const ThanksTokenSummary: FC<{ treeId?: string; receivedTotal?: number }> = ({
  treeId,
  receivedTotal,
}) => {
  const navigate = useNavigate();
  const { balance: thanksTokenBalance } = useUserThanksTokenBalance(treeId);

  const sendable = thanksTokenBalance;

  return (
    <VStack align="stretch" gap={3}>
      {/* Big rounded card */}
      <Box
        w="full"
        maxW="sm"
        mx="auto"
        bg="white"
        borderRadius="2xl"
        borderWidth="2px"
        borderColor="gray.200"
        p={6}
        boxShadow="sm"
      >
        <VStack gap={4}>
          <Text fontSize="sm" color="gray.600">
            送付可能量
          </Text>

          <HStack gap={2} align="baseline">
            <Text fontSize={{ base: "4xl", sm: "5xl" }} fontWeight="bold">
              {sendable.toLocaleString()}
            </Text>
            <Text fontSize="xs" color="gray.500">
              thanks
            </Text>
          </HStack>

          <CommonButton
            w="56"
            h="12"
            fontSize="md"
            borderRadius="xl"
            bgColor="yellow.400"
            _hover={{ bg: "yellow.500" }}
            onClick={() => treeId && navigate(`/${treeId}/thankstoken/send`)}
          >
            <HStack gap={2}>
              <FaPlus />
              <Text>送る</Text>
            </HStack>
          </CommonButton>
        </VStack>
      </Box>

      {/* Optional “受け取ったThanks” line */}
      {typeof receivedTotal === "number" && (
        <Box maxW="sm" mx="auto" w="full" pt={1}>
          <Text fontSize="sm" color="gray.600">
            受け取ったThanks
          </Text>
          <HStack gap={2} align="baseline">
            <Text fontSize="3xl" fontWeight="bold">
              {receivedTotal.toLocaleString()}
            </Text>
            <Text fontSize="xs" color="gray.500">
              thanks
            </Text>
          </HStack>
        </Box>
      )}
    </VStack>
  );
};
