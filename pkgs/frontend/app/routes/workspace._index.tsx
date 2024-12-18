import { FC, useEffect, useMemo, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";
import { BasicButton } from "~/components/BasicButton";
import { useNavigate } from "@remix-run/react";
import { useActiveWallet } from "hooks/useWallet";
import { useHats } from "../../hooks/useHats";

const WorkspaceCard: FC<{
  treeId: string;
  name: string;
  imageUrl: string | undefined;
}> = ({ treeId, name, imageUrl }) => {
  const navigate = useNavigate();

  return (
    <Box
      w="100%"
      borderRadius="xl"
      border="1px solid #E0E0E0"
      mb={3}
      p={3}
      display="flex"
      alignItems="center"
      onClick={() => navigate(`/${treeId}`)}
    >
      <WorkspaceIcon workspaceImageUrl={imageUrl} size={10} />
      <Text ml={4}>{name}</Text>
    </Box>
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

  const { wallet } = useActiveWallet();
  const { getWorkspacesList } = useHats();

  useEffect(() => {
    console.log("wallet?.account?.address", wallet?.account?.address);
  }, [wallet?.account?.address]);

  useEffect(() => {
    const fetchWorkspacesList = async () => {
      const _workspacesList = await getWorkspacesList({
        walletAddress: wallet?.account?.address as `0x${string}`,
      });
      console.log("_workspacesList", _workspacesList);

      setWorkspacesList(_workspacesList);
    };
    fetchWorkspacesList();
  }, [wallet?.account?.address, getWorkspacesList]);

  return (
    <>
      <Box mt={5}>
        {workspacesList.map((workspace) => (
          <WorkspaceCard key={workspace.treeId} {...workspace} />
        ))}
      </Box>
      <BasicButton mt={7} onClick={() => navigate("/workspace/new")}>
        新しいワークスペースを作成
      </BasicButton>
    </>
  );
};

export default Workspace;
