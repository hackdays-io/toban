import {
  AspectRatio,
  Box,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useTreeInfo } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import type { FC } from "react";
import { FaPlus } from "react-icons/fa6";
import { StickyNav } from "~/components/StickyNav";
import { AssistCreditHistory } from "~/components/assistcredit/History";
import { CommonButton } from "~/components/common/CommonButton";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { MyRole } from "~/components/roles/MyRole";
import { VRole } from "~/components/roles/VRole";

const WorkspaceTop: FC = () => {
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const { treeId } = useParams();
  const tree = useTreeInfo(Number(treeId));

  const navigate = useNavigate();

  return (
    <>
      {/* Thanks Token summary */}
      <Box my={4}>
        <Heading pb={3}>サンクストークン</Heading>
        <ThanksTokenSummary treeId={treeId} />
      </Box>

      <Box my={4}>
        <HStack justify="space-between" alignItems="center" pb={4}>
          <Heading>直近のアクティビティ</Heading>
          <Link to={`/${treeId}/assistcredit/history`}>
            <CommonButton size="xs" bgColor="blue.400">
              もっと見る
            </CommonButton>
          </Link>
        </HStack>
        {treeId && <AssistCreditHistory limit={3} treeId={treeId} />}
      </Box>

      {/* My roles */}
      <Box my={4}>
        <Heading py={4}>担当当番</Heading>
        <VStack>
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

      {/* Removed all roles list from home. Moved to roles screen. */}
      <StickyNav />
    </>
  );
};

export default WorkspaceTop;

const ThanksTokenSummary: FC<{ treeId?: string }> = ({ treeId }) => {
  const { wallet } = useActiveWallet();
  const navigate = useNavigate();

  const { data } = useBalanceOfFractionTokens({
    where: {
      workspaceId: treeId,
      owner: wallet?.account.address.toLowerCase(),
    },
    first: 100,
  });

  const totalBalance = (data?.balanceOfFractionTokens || []).reduce(
    (acc, cur) => acc + Number(cur.balance || 0),
    0,
  );

  // In current model, sendable equals owned balance
  const sendable = totalBalance;

  return (
    <Flex
      w="full"
      bg="gray.50"
      borderRadius={8}
      borderWidth={1}
      borderColor="gray.200"
      p={4}
      alignItems="center"
      justifyContent="space-between"
      gap={4}
    >
      <HStack gap={8}>
        <VStack alignItems="start" gap={0}>
          <Text fontSize="sm" color="gray.600">
            残高
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {totalBalance.toLocaleString()}
          </Text>
        </VStack>
        <VStack alignItems="start" gap={0}>
          <Text fontSize="sm" color="gray.600">
            送付可能量
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {sendable.toLocaleString()}
          </Text>
        </VStack>
      </HStack>
      <CommonButton
        onClick={() => treeId && navigate(`/${treeId}/thankstoken/send`)}
      >
        送付画面へ
      </CommonButton>
    </Flex>
  );
};
