import { Box, Image, Text } from "@chakra-ui/react";
import { FC } from "react";
import { HatsDetailSchama } from "types/hats";

interface BasicRoleProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
}

export const BasicRole: FC<BasicRoleProps> = (params?) => {
  const { detail, imageUri } = params!;

  return (
    <Box>
      <Text>{detail?.data.name}</Text>
      <Image src={imageUri} />
    </Box>
  );
};
