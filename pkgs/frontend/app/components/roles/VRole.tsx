import { Text, VStack } from "@chakra-ui/react";
import { FC } from "react";
import { HatsDetailSchama } from "types/hats";
import { RoleIcon } from "../icon/RoleIcon";

interface BasicRoleProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
  iconSize?: number | `${number}px` | "full";
}

export const VRole: FC<BasicRoleProps> = ({
  detail,
  imageUri,
  iconSize = "130px",
}) => {
  return (
    <VStack>
      <RoleIcon size={iconSize} roleImageUrl={imageUri} />
      <Text>{detail?.data?.name}</Text>
    </VStack>
  );
};
