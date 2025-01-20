import { Icon } from "@chakra-ui/react";
import { FaPeopleGroup } from "react-icons/fa6";
import { CommonIcon } from "../common/CommonIcon";

interface WorkspaceIconProps {
  workspaceImageUrl?: string | undefined;
  size?: `${number}px` | number | "full";
}

export const WorkspaceIcon = ({
  workspaceImageUrl,
  size = "full",
}: WorkspaceIconProps) => {
  return (
    <CommonIcon
      imageUrl={workspaceImageUrl}
      size={size}
      borderRadius="xl"
      fallbackIconComponent={
        <Icon fontSize={size} bgColor="yellow.200" p={2}>
          <FaPeopleGroup />
        </Icon>
      }
    />
  );
};
