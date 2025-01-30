import { Box } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import type { FC } from "react";
import { PageHeader } from "~/components/PageHeader";

const WorkspaceSettings: FC = () => {
  const { treeId } = useParams();

  return (
    <Box>
      <PageHeader title="ワークスペース設定" />
    </Box>
  );
};

export default WorkspaceSettings;
