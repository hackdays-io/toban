import { Box, Flex, Text } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useTreeInfo } from "hooks/useHats";
import { FC } from "react";
import CommonButton from "~/components/common/CommonButton";

const WorkspaceTop: FC = () => {
  const { treeId } = useParams();

  treeId;
  // const tree = useTreeInfo(Number(treeId));

  return (
    <Box w="100%">
      <Flex my={4} placeItems="center">
        <Text fontSize="lg" flexGrow={1}>
          Splits
        </Text>
        <CommonButton w={"auto"} size="sm">
          Create New
        </CommonButton>
      </Flex>
      <Box px={2} py={2} borderRadius={8} border="1px solid #333">
        {/* Info here */}
      </Box>
    </Box>
  );
};

export default WorkspaceTop;
