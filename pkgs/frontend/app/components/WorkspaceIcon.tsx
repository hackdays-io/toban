import { FaPeopleGroup } from "react-icons/fa6";
import { CommonIcon } from "./CommonIcon";

interface WorkspaceIconProps {
  workspaceImageUrl?: string;
  size: number;
}

export const WorkspaceIcon = ({
  workspaceImageUrl,
  size,
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
