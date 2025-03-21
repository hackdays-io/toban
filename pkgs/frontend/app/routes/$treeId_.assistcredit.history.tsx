import { Box, Heading, Tabs, VStack } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import type { FC } from "react";
import { PageHeader } from "~/components/PageHeader";
import { AssistCreditHistory } from "~/components/assistcredit/History";
import { Treemap } from "~/components/assistcredit/Treemap";
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
          <Tabs.Trigger value="chart">グラフ</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="list">
          <Box mt={2}>
            {treeId && <AssistCreditHistory treeId={treeId} limit={100} />}
          </Box>
        </Tabs.Content>
        <Tabs.Content value="chart">
          {treeId && (
            <VStack gap={6} alignItems="stretch" width="100%">
              <VerticalBar treeId={treeId} />
              <Treemap treeId={treeId} />
            </VStack>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default WorkspaceMember;
