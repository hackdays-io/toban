import { FC } from "react";
import { useParams } from "@remix-run/react";
import { Box, Text } from "@chakra-ui/react";

const EditRole: FC = () => {
  const { treeId, hatId, address } = useParams();
  return (
    <>
      <Box mt={5} w="100%">
        <Text fontSize="lg">ロールを編集</Text>
        <div>EditRole</div>
        <>{treeId}</>
        <>{hatId}</>
        <>{address}</>
      </Box>
    </>
  );
};

export default EditRole;
