import { Box, Flex, HStack, Heading, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useTreeInfo } from "hooks/useHats";
import {
  useThanksToken,
  useUserThanksTokenBalance,
} from "hooks/useThanksToken";
import { useActiveWallet } from "hooks/useWallet";
import type { FC } from "react";
import { FaPlus } from "react-icons/fa6";
import { formatEther } from "viem";
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
      <Box mb={4}>
        <ThanksTokenSummary treeId={treeId} />
      </Box>

      {/* Recent activity */}
      <Box my={8}>
        <HStack justify="space-between" alignItems="center" pb={4}>
          <Heading fontSize="xl">直近のアクティビティ</Heading>
          <Link to={`/${treeId}/thankstoken/history`}>
            <CommonButton size="xs" bgColor="yellow.400">
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

const ThanksTokenSummary: FC<{ treeId?: string }> = ({ treeId }) => {
  const navigate = useNavigate();
  const { balance: thanksTokenBalance } = useUserThanksTokenBalance(treeId);
  const { mintableAmount } = useThanksToken(treeId || "");

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
              {Number(formatEther(mintableAmount || 0n)).toLocaleString()}
            </Text>
            <Text fontSize="xs" color="gray.500">
              THX
            </Text>
          </HStack>

          <CommonButton
            fontSize="md"
            borderRadius="xl"
            bgColor="yellow.400"
            _hover={{ bg: "yellow.500" }}
            onClick={() => treeId && navigate(`/${treeId}/thankstoken/send`)}
          >
            <HStack gap={2}>
              <Text>サンクストークンを送る</Text>
            </HStack>
          </CommonButton>
        </VStack>
      </Box>

      <Box maxW="sm" mx="auto" w="full" pt={1}>
        <Text fontSize="sm" color="gray.600">
          受け取ったサンクストークン
        </Text>
        <HStack gap={2} align="baseline">
          <Text fontSize="3xl" fontWeight="bold">
            {Number(formatEther(BigInt(thanksTokenBalance))).toLocaleString()}
          </Text>
          <Text fontSize="xs" color="gray.500">
            THX
          </Text>
        </HStack>
      </Box>
    </VStack>
  );
};
