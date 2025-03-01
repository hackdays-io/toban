import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useGetTransferFractionTokens } from "hooks/useFractionToken";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { CommonDialog } from "~/components/common/CommonDialog";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";
import { useHats } from "../../hooks/useHats";

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
  const navigate = useNavigate();

  const { wallet, isSmartWallet, isConnectingEmbeddedWallet } =
    useActiveWallet();

  const { getWorkspacesList, getWorkspacesListByIds } = useHats();

  const address = useMemo(() => {
    if (isConnectingEmbeddedWallet && !isSmartWallet) return;
    return wallet?.account?.address as Address;
  }, [wallet?.account?.address, isSmartWallet, isConnectingEmbeddedWallet]);

  const [workspacesList, setWorkspacesList] = useState<
    {
      treeId: string;
      name: string;
      imageUrl: string | undefined;
    }[]
  >([]);

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

  const { data, loading } = useGetTransferFractionTokens({
    where: { to: address?.toLowerCase() },
    first: 100,
  });

  const treeIds = useMemo(() => {
    if (!data) return;
    const tokens = data.transferFractionTokens;
    if (tokens.length === 0) return;
    return Array.from(
      new Set(
        tokens
          .map(({ workspaceId }) => Number(workspaceId))
          .filter(
            (id) =>
              id > 0 &&
              !workspacesList.some(
                (workspace) => workspace.treeId === id.toString(),
              ),
          ),
      ),
    );
  }, [workspacesList, data]);

  const [assistedWorkspacesList, setAssistedWorkspacesList] = useState<
    {
      treeId: string;
      name: string;
      imageUrl: string | undefined;
    }[]
  >([]);

  useEffect(() => {
    const fetchAssistedWorkspacesList = async () => {
      if (!address || !treeIds) return;
      const _assistedWorkspacesList = await getWorkspacesListByIds({
        treeIds,
      });

      setAssistedWorkspacesList(_assistedWorkspacesList);
    };

    fetchAssistedWorkspacesList();
  }, [address, treeIds, getWorkspacesListByIds]);

  return (
    <>
      <Box>
        <Heading my={3}>ロールメンバーのワークスペース</Heading>
        {workspacesList.length > 0 ? (
          workspacesList.map((workspace) => (
            <WorkspaceCard key={workspace.treeId} {...workspace} />
          ))
        ) : (
          <Text mx={2} fontStyle="italic" color="gray.400">
            該当なし
          </Text>
        )}
      </Box>
      <Box mt={7}>
        <Heading my={3}>お手伝いしているワークスペース</Heading>
        {assistedWorkspacesList.length > 0 ? (
          assistedWorkspacesList.map((workspace) => (
            <WorkspaceCard key={workspace.treeId} {...workspace} />
          ))
        ) : (
          <Text mx={2} fontStyle="italic" color="gray.400">
            該当なし
          </Text>
        )}
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
