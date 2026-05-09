import { Box, type BoxProps } from "~/components/chakra-shim";
import { CommonInput } from "../common/CommonInput";

export const InputName = ({
  name,
  setName,
  ...boxProps
}: {
  name: string;
  setName: (name: string) => void;
} & BoxProps) => {
  return (
    <Box w="100%" {...boxProps}>
      <CommonInput
        minHeight="45px"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        w="100%"
      />
    </Box>
  );
};
