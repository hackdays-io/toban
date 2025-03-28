import { HStack, Text, VStack } from "@chakra-ui/react";
import type { FC } from "react";
import type { HatsDetailSchama } from "types/hats";
import { RoleIcon } from "../icon/RoleIcon";

interface BasicRoleProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
  bgColor?: string;
}

export const RoleTag: FC<BasicRoleProps> = ({
  detail,
  imageUri,
  bgColor = "yellow.400",
}) => {
  return (
    <HStack rounded="md" backgroundColor={bgColor} gap={1} overflow="hidden">
      <RoleIcon size="30px" roleImageUrl={imageUri} borderRadius="md" />
      <Text pl={1} pr={2} fontSize="sm">
        {detail?.data?.name}
      </Text>
    </HStack>
  );
};
