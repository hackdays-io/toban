import { Box } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useTreeInfo } from "hooks/useHats";
import { FC } from "react";
import { BasicRole } from "~/components/BasicRole";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";

const WorkspaceTop: FC = () => {
  const { treeId } = useParams();

  const tree = useTreeInfo(Number(treeId));

  return (
    <Box>
      {tree?.hats
        ?.filter((h) => Number(h.levelAtLocalTree) >= 2)
        .map((h) => (
          <HatsListItemParser
            key={h.id}
            imageUri={h.imageUri}
            detailUri={h.details}
            children={(<BasicRole />) as any}
          />
        ))}
    </Box>
  );
};

export default WorkspaceTop;
