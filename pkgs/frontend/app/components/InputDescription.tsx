import { Box, BoxProps } from "@chakra-ui/react";
import { CommonTextArea } from "./common/CommonTextarea";

export const InputDescription = ({
  description,
  setDescription,
  ...boxProps
}: {
  description: string;
  setDescription: (description: string) => void;
} & BoxProps) => {
  return (
    <Box minH="100px" w="100%" {...boxProps}>
      <CommonTextArea
        minHeight="125px"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
    </Box>
  );
};
