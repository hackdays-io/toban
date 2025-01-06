import { FC, useEffect, useMemo, useState } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";
import { BasicButton } from "~/components/BasicButton";
import { Link, useNavigate } from "@remix-run/react";
import { useActiveWallet } from "hooks/useWallet";
import { useHats } from "../../hooks/useHats";
import { Address } from "viem";
import { CommonDialog } from "~/components/common/CommonDialog";

const WorkspaceCard: FC<{
  treeId: string;
  name: string;
  imageUrl: string | undefined;
}> = ({ treeId, name, imageUrl }) => {
  return (
    <Link to={`/${treeId}`}>
      <Flex w="100%" borderRadius="xl" mb={3} p={2} alignItems="center">
        <WorkspaceIcon workspaceImageUrl={imageUrl} size="60px" />
        <Box ml={4}>
          <Text>{name}</Text>
          <Text fontSize="xs">Workspace id: {treeId}</Text>
        </Box>
      </Flex>
    </Link>
  );
};

const Workspace: FC = () => {
  const [workspacesList, setWorkspacesList] = useState<
    {
      treeId: string;
      name: string;
      imageUrl: string | undefined;
    }[]
  >([]);

  const navigate = useNavigate();

  const { wallet, isSmartWallet, isConnectingEmbeddedWallet } =
    useActiveWallet();
  const { getWorkspacesList } = useHats();

  const address = useMemo(() => {
    if (isConnectingEmbeddedWallet && !isSmartWallet) return;
    return wallet?.account?.address as Address;
  }, [wallet?.account?.address, isSmartWallet, isConnectingEmbeddedWallet]);

  useEffect(() => {
    const fetchWorkspacesList = async () => {
      if (!address) return;
      const _workspacesList = await getWorkspacesList({
        walletAddress: address as `0x${string}`,
      });

      setWorkspacesList(_workspacesList);
    };
    fetchWorkspacesList();
  }, [address, getWorkspacesList]);

  return (
    <>
      <Box>
        {workspacesList.map((workspace) => (
          <WorkspaceCard key={workspace.treeId} {...workspace} />
        ))}
      </Box>
      <BasicButton mt={7} onClick={() => navigate("/workspace/new")}>
        新しいワークスペースを作成
      </BasicButton>
      <CommonDialog
        dialogTriggerReactNode={
          <BasicButton bgColor="blue.400" mt={3} mb={5}>
            ワークスペースに参加
          </BasicButton>
        }
      >
        <Box p={5}>
          <Text>
            ワークスペースの管理者に役割を割り当ててもらうか、役割をもっている人からアシストクレジットを受け取るとワークスペースに自動的に参加できます。
          </Text>
        </Box>
      </CommonDialog>
    </>
  );
};

export default Workspace;
