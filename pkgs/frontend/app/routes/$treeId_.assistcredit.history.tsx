import { Box, Heading } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import type { FC } from "react";
import { PageHeader } from "~/components/PageHeader";
import { AssistCreditHistory } from "~/components/assistcredit/History";
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
      <Box mt={5}>
        {treeId && <AssistCreditHistory treeId={treeId} limit={100} />}
      </Box>
      <Box mt={5}>{treeId && <VerticalBar treeId={treeId} />}</Box>
    </Box>
  );
};

export default WorkspaceMember;
