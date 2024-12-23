import { Box } from "@chakra-ui/react";
import { CommonInput } from "./common/CommonInput";

export const InputName = ({
  name,
  setName,
}: {
  name: string;
  setName: (name: string) => void;
}) => {
  return (
    <Box w="100%" mt={8}>
      <CommonInput
        minHeight="45px"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </Box>
  );
};
