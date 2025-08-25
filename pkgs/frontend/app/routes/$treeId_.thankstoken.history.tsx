import { Box, Grid } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import type { FC } from "react";
import { PageHeader } from "~/components/PageHeader";
import { ThanksTokenHistory } from "~/components/thankstoken/History";

const ThanksTokenHistoryPage: FC = () => {
  const { treeId } = useParams();

  if (!treeId) {
    return <div>Workspace not found</div>;
  }

  return (
    <Grid gridTemplateRows="auto 1fr" minH="calc(100vh - 100px)">
      <PageHeader title="サンクストークン履歴" />
      <Box my={6}>
        <ThanksTokenHistory treeId={treeId} limit={50} />
      </Box>
    </Grid>
  );
};

export default ThanksTokenHistoryPage;
