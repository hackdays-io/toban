import { FaPeopleGroup } from "react-icons/fa6";
import { CommonIcon } from "../common/CommonIcon";

interface WorkspaceIconProps {
  workspaceImageUrl?: string;
  size?: number | "full";
}

export const WorkspaceIcon = ({
  workspaceImageUrl,
  size = "full",
}: WorkspaceIconProps) => {
  return (
    <CommonIcon
      imageUrl={workspaceImageUrl}
      size={size}
      fallbackIconComponent={
        <FaPeopleGroup
          style={{
            width: "90%",
            height: "90%",
            objectFit: "cover",
          }}
        />
      }
    />
  );
};