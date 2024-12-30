import {
  AspectRatio,
  Box,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link, useNavigate, useParams } from "@remix-run/react";
import { useTreeInfo } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import { FC } from "react";
import { FaPlus } from "react-icons/fa6";
import { MyRole } from "~/components/roles/MyRole";
import { CommonButton } from "~/components/common/CommonButton";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { VRole } from "~/components/roles/VRole";

const WorkspaceTop: FC = () => {
  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address;

  const { treeId } = useParams();
  const tree = useTreeInfo(Number(treeId));

  const navigate = useNavigate();

  return (
    <>
      {/* My roles */}
      <Box my={4}>
        <Heading py={4}>My Roles</Heading>
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
        <Heading py={4}>All Roles</Heading>
        <SimpleGrid columns={4} gap={4}>
          {tree?.hats
            ?.filter((h) => Number(h.levelAtLocalTree) >= 2)
            .map((h) => (
              <Link key={"allrole" + h.id} to={`/${treeId}/${h.id}`}>
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
    </>
  );
};

export default WorkspaceTop;
