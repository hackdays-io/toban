import { Box, Heading, Tabs, VStack } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import type { FC } from "react";
import { PageHeader } from "~/components/PageHeader";
import { FriendshipRanking } from "~/components/assistcredit/FriendshipRanking";
import { AssistCreditHistory } from "~/components/assistcredit/History";
import { Treemap } from "~/components/assistcredit/Treemap";
import { TreemapReceived } from "~/components/assistcredit/TreemapReceived";
import { VerticalBar } from "~/components/assistcredit/VerticalBar";

const WorkspaceMember: FC = () => {
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
      <Tabs.Root defaultValue="list" mt={5}>
        <Tabs.List>
          <Tabs.Trigger value="list">リスト</Tabs.Trigger>
          <Tabs.Trigger value="friendship">フレンドシップ</Tabs.Trigger>
          <Tabs.Trigger value="chart">グラフ</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="list">
          <Box mt={2}>
            {treeId && <AssistCreditHistory treeId={treeId} limit={500} />}
          </Box>
        </Tabs.Content>
        <Tabs.Content value="friendship">
          <Box mt={2}>
            {treeId && <FriendshipRanking treeId={treeId} limit={500} />}
          </Box>
        </Tabs.Content>
        <Tabs.Content value="chart">
          {treeId && (
            <VStack gap={6} alignItems="stretch" width="100%">
              <VerticalBar treeId={treeId} />
              <Treemap treeId={treeId} />
              <TreemapReceived treeId={treeId} />
            </VStack>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default WorkspaceMember;
