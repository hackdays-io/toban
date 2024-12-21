import { Box } from "@chakra-ui/react";
import { CommonTextArea } from "./common/CommonTextarea";

export const InputDescription = ({
  description,
  setDescription,
}: {
  description: string;
  setDescription: (description: string) => void;
}) => {
  return (
    <Box minH="100px" w="100%" mt={6}>
      <CommonTextArea
        minHeight="125px"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </Box>
  );
};
