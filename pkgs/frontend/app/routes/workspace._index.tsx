import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { treeIdHexToDecimal } from "@hatsprotocol/sdk-v1-core";
import { Link, useNavigate } from "@remix-run/react";
import axios from "axios";
import { useGetBalanceOfFractionTokens } from "hooks/useFractionToken";
import { useGetHatsByWorkspaceIds, useGetWorkspaces } from "hooks/useHats";
import { useGetHoldingThanksTokens } from "hooks/useThanksToken";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useEffect, useMemo, useState } from "react";
import { ipfs2https } from "utils/ipfs";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { CommonDialog } from "~/components/common/CommonDialog";
import { WorkspaceIcon } from "~/components/icon/WorkspaceIcon";

const WorkspaceCard: FC<{
  workspaceId: string;
  imageUrl: string;
  name?: string;
  description?: string;
}> = ({ workspaceId, imageUrl, name, description }) => {
  return (
    <Link to={`/${workspaceId}`}>
      <Flex
        w="100%"
        borderRadius="xl"
        mb={3}
        p={2}
        bgColor={"white"}
        shadow={"md"}
        alignItems="center"
      >
        <WorkspaceIcon workspaceImageUrl={imageUrl} size="60px" />
        <Box ml={4}>
          {name && <Text fontWeight={"bold"}>{name}</Text>}
          {description && (
            <Text fontSize={"sm"} color={"GrayText"}>
              {description}
            </Text>
          )}
          <Text fontSize={name ? "xs" : "md"}>Workspace ID: {workspaceId}</Text>
        </Box>
      </Flex>
    </Link>
  );
};

const WorkspaceSection: FC<{ title: string; workspaces: Workspace[] }> = ({
  title,
  workspaces,
}) => {
  const [detailsMap, setDetailsMap] = useState<
    Record<string, { name?: string; description?: string }>
  >({});

  useEffect(() => {
    for (const w of workspaces) {
      if (!w.details.startsWith("ipfs://")) continue;
      axios
        .get(ipfs2https(w.details) || "")
        .then((res) => {
          const {
            data: {
              data: { name, description },
            },
          } = res;
          setDetailsMap((prev) => ({ ...prev, [w.id]: { name, description } }));
        })
        .catch((error) => {
          console.error("Error fetching workspace details:", error);
        });
    }
  }, [workspaces]);

  return (
    <Box>
      <Heading my={3}>{title}</Heading>
      {workspaces.length > 0 ? (
        workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspaceId={workspace.id}
            name={detailsMap[workspace.id]?.name}
            description={detailsMap[workspace.id]?.description}
            imageUrl={ipfs2https(workspace.imageUri) || ""}
          />
        ))
      ) : (
        <Text mx={2} fontStyle="italic" color="gray.400">
          該当なし
        </Text>
      )}
    </Box>
  );
};

type Workspace = {
  id: string;
  details: string;
  imageUri: string;
  name?: string;
  description?: string;
};

const Workspace: FC = () => {
  const navigate = useNavigate();

  const { wallet } = useActiveWallet();
  const me = wallet?.account?.address?.toLocaleLowerCase();

  const { workspaces: joinedWorkspaces, loading: loadingJoined } =
    useGetWorkspaces({
      id: me,
    });
  const joinedWorkspaceIds = useMemo(
    () => joinedWorkspaces.map((w) => w.id),
    [joinedWorkspaces],
  );

  const { data: fractionTokensData, loading: loadingAssisted } =
    useGetBalanceOfFractionTokens({
      where: {
        owner: me,
        workspaceId_not_in: loadingJoined ? [] : joinedWorkspaceIds,
      },
    });
  const assistedWorkspaceIds = useMemo(() => {
    if (!fractionTokensData) return [];
    return fractionTokensData.balanceOfFractionTokens.map((t) => t.workspaceId);
  }, [fractionTokensData]);
  const { hats: assistedHats } = useGetHatsByWorkspaceIds(assistedWorkspaceIds);
  const assistedWorkspaces = useMemo(
    () =>
      assistedHats.map(
        (h: { tree: { id: string }; details: string; imageUri: string }) => ({
          id: String(treeIdHexToDecimal(h.tree.id)),
          details: h.details,
          imageUri: h.imageUri,
        }),
      ),
    [assistedHats],
  );

  const excludeWorkspaceIds = useMemo(() => {
    const ids = [...joinedWorkspaceIds, ...assistedWorkspaceIds];
    return ids.length > 0 ? ids : undefined;
  }, [joinedWorkspaceIds, assistedWorkspaceIds]);
  const holdingThanksToken = useGetHoldingThanksTokens(me as Address, {
    where: {
      workspaceId_not_in: excludeWorkspaceIds,
    },
  });
  const { hats: thankedHats } = useGetHatsByWorkspaceIds(
    holdingThanksToken.map((t) => t.workspaceId),
  );
  const thankedWorkspaces = useMemo(() => {
    if (!thankedHats) return [];
    return thankedHats.map(
      (h: { tree: { id: string }; details: string; imageUri: string }) => ({
        id: String(treeIdHexToDecimal(h.tree.id)),
        details: h.details,
        imageUri: h.imageUri,
      }),
    );
  }, [thankedHats]);

  return (
    <Box data-testid="workspace-page">
      {[...joinedWorkspaces, ...assistedWorkspaces, ...thankedWorkspaces]
        .length === 0 && (
        <Text mx={2} fontStyle="italic" color="gray.400">
          ワークスペースに参加していません。
        </Text>
      )}
      {joinedWorkspaces.length > 0 && (
        <WorkspaceSection
          title="役割をもっているワークスペース"
          workspaces={joinedWorkspaces}
        />
      )}
      {assistedWorkspaces.length > 0 && (
        <WorkspaceSection
          title="お手伝いしているワークスペース"
          workspaces={assistedWorkspaces}
        />
      )}
      {thankedWorkspaces.length > 0 && (
        <WorkspaceSection
          title="ありがとうをもらったワークスペース"
          workspaces={thankedWorkspaces}
        />
      )}
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
            ワークスペースの管理者に当番を割り当ててもらうか、当番をもっている人からアシストクレジットを受け取るとワークスペースに自動的に参加できます。
          </Text>
        </Box>
      </CommonDialog>
    </Box>
  );
};

export default Workspace;
