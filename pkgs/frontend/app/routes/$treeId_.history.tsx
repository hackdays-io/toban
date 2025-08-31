import { Box, HStack, Heading, Tabs, VStack } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import type { FC } from "react";
import { PageHeader } from "~/components/PageHeader";
import { FriendshipRanking } from "~/components/assistcredit/FriendshipRanking";
import { AssistCreditHistory } from "~/components/assistcredit/History";
import { Treemap as RoleShareTreemap } from "~/components/assistcredit/Treemap";
import { TreemapReceived as RoleShareTreemapReceived } from "~/components/assistcredit/TreemapReceived";
import { VerticalBar as RoleShareVerticalBar } from "~/components/assistcredit/VerticalBar";
import { ThanksTokenHistory } from "~/components/thankstoken/History";
import { TreemapHoldings } from "~/components/thankstoken/TreemapHoldings";
import { TreemapSent } from "~/components/thankstoken/TreemapSent";

const WorkspaceHistoryPage: FC = () => {
  const { treeId } = useParams();

  return (
    <Box mb={4}>
      <PageHeader
        title={
          <Heading size="lg" fontWeight="bold">
            アクティビティ一覧
          </Heading>
        }
      />
      <Tabs.Root defaultValue="thanks-list" mt={5}>
        <Tabs.List overflowX="auto" whiteSpace="nowrap" gap={2}>
          <HStack as="span" gap={2}>
            <Tabs.Trigger value="thanks-list">リスト（Thanks）</Tabs.Trigger>
            <Tabs.Trigger value="thanks-graph">グラフ（Thanks）</Tabs.Trigger>
            <Tabs.Trigger value="friendship">フレンドシップ</Tabs.Trigger>
            <Tabs.Trigger value="roleshare-list">
              リスト（ロールシェア）
            </Tabs.Trigger>
            <Tabs.Trigger value="roleshare-graph">
              グラフ（ロールシェア）
            </Tabs.Trigger>
          </HStack>
        </Tabs.List>

        <Tabs.Content value="thanks-list">
          <Box mt={2}>
            {treeId && <ThanksTokenHistory treeId={treeId} limit={500} />}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="thanks-graph">
          {treeId && (
            <VStack gap={6} alignItems="stretch" width="100%">
              <TreemapHoldings treeId={treeId} />
              <TreemapSent treeId={treeId} />
            </VStack>
          )}
        </Tabs.Content>

        <Tabs.Content value="friendship">
          <Box mt={2}>
            {treeId && <FriendshipRanking treeId={treeId} limit={500} />}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="roleshare-list">
          <Box mt={2}>
            {treeId && <AssistCreditHistory treeId={treeId} limit={500} />}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="roleshare-graph">
          {treeId && (
            <VStack gap={6} alignItems="stretch" width="100%">
              <RoleShareVerticalBar treeId={treeId} />
              <RoleShareTreemap treeId={treeId} />
              <RoleShareTreemapReceived treeId={treeId} />
            </VStack>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default WorkspaceHistoryPage;
