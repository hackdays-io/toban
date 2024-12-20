import { FC } from "react";
import { useParams } from "@remix-run/react";
import { Box, Text } from "@chakra-ui/react";

const NewRole: FC = () => {
  const { treeId, hatId, address } = useParams();
  return (
    <>
      <Box mt={5} w="100%">
        <Text fontSize="lg">新しいロールを作成</Text>
        <div>NewRole</div>
        <>{treeId}</>
        <>{hatId}</>
        <>{address}</>
      </Box>
    </>
  );
};

export default NewRole;
