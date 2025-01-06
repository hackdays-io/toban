import { HStack, Text, VStack } from "@chakra-ui/react";
import { FC } from "react";
import { HatsDetailSchama } from "types/hats";
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
    <HStack rounded="md" backgroundColor={bgColor} gap={1}>
      <RoleIcon size="30px" roleImageUrl={imageUri} borderRadius="md" />
      <Text pl={1} pr={2}>
        {detail?.data?.name}
      </Text>
    </HStack>
  );
};
