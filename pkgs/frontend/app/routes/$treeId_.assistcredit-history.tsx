import { Box, Heading } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import type { FC } from "react";
import { PageHeader } from "~/components/PageHeader";
import { AssistCreditHistory } from "~/components/assistcredit/History";

const WorkspaceMember: FC = () => {
  const { treeId } = useParams();

  return (
    <Box my={4}>
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
    </Box>
  );
};

export default WorkspaceMember;
