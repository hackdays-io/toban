import {
  AspectRatio,
  Box,
  HStack,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
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

      {/* All roles */}
      <Box my={4}>
        <Heading py={4}>当番一覧</Heading>
        <SimpleGrid columns={4} gap={4}>
          {tree?.hats
            ?.filter((h) => Number(h.levelAtLocalTree) >= 2)
            .map((h) => (
              <Link key={`allrole${h.id}`} to={`/${treeId}/${h.id}`}>
                <HatsListItemParser imageUri={h.imageUri} detailUri={h.details}>
                  <VRole iconSize="80px" />
                </HatsListItemParser>
              </Link>
            ))}
          <VStack>
            <AspectRatio width="80px" ratio={1}>
              <CommonButton
                rounded="xl"
                onClick={() => navigate(`/${treeId}/roles/new`)}
                bgColor="gray.300"
              >
                <FaPlus />
              </CommonButton>
            </AspectRatio>
            <Text>Add role</Text>
          </VStack>
        </SimpleGrid>
      </Box>
      <StickyNav />
    </>
  );
};

export default WorkspaceTop;
