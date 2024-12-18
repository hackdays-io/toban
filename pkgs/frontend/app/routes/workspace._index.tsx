import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";
import { BasicButton } from "~/components/BasicButton";
import { useNavigate } from "@remix-run/react";
import { useActiveWallet } from "hooks/useWallet";
import { useHats } from "../../hooks/useHats";
import { Address } from "viem";

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
      <WorkspaceIcon workspaceImageUrl={imageUrl} size={12} />
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
