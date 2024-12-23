import {
  AspectRatio,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import { useTreeInfo } from "hooks/useHats";
import { useActiveWallet } from "hooks/useWallet";
import { FC } from "react";
import { FaPlus } from "react-icons/fa6";
import { VerticalRole, RoleActions } from "~/components/BasicRole";
import { CommonButton } from "~/components/common/CommonButton";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";

const WorkspaceTop: FC = () => {
  const { wallet } = useActiveWallet();
  const address = wallet?.account?.address;

  const { treeId } = useParams();
  const tree = useTreeInfo(Number(treeId));
  const topHatId = tree?.hats?.find((h) => h.levelAtLocalTree === 0)?.id;

  const navigate = useNavigate();
  const navigateToNewRole = () => navigate(`/workspaces/${topHatId}/roles/new`);

  return (
    <>
      {/* My roles */}
      <Heading padding={4}>My Roles</Heading>
      <VStack>
        {tree?.hats
          ?.filter((h) => Number(h.levelAtLocalTree) >= 2)
          .filter((h) => h.wearers?.map((w) => w.id === address))
          .map((h) => (
            <HatsListItemParser
              key={h.id}
              imageUri={h.imageUri}
              detailUri={h.details}
            >
              <RoleActions address={address} treeId={treeId} hatId={h.id} />
            </HatsListItemParser>
          ))}
      </VStack>

      {/* All roles */}
      <Heading padding={4}>All Roles</Heading>
      <SimpleGrid columns={3} gap={4}>
        {tree?.hats
          ?.filter((h) => Number(h.levelAtLocalTree) >= 2)
          .map((h) => (
            <HatsListItemParser
              key={h.id}
              imageUri={h.imageUri}
              detailUri={h.details}
            >
              <VerticalRole />
            </HatsListItemParser>
          ))}
        <VStack>
          <AspectRatio width="full" ratio={1}>
            <CommonButton rounded="4xl" onClick={navigateToNewRole}>
              <FaPlus />
            </CommonButton>
          </AspectRatio>
          <Text>Add role</Text>
        </VStack>
      </SimpleGrid>
    </>
  );
};

export default WorkspaceTop;
