import { FaCircleUser } from "react-icons/fa6";
import { CommonIcon } from "../common/CommonIcon";

interface UserIconProps {
  userImageUrl?: string;
  size?: number | `${number}px` | "full";
}

export const UserIcon = ({ userImageUrl, size = "full" }: UserIconProps) => {
  return (
    <CommonIcon
      imageUrl={userImageUrl}
      size={size}
      fallbackIconComponent={
        <FaCircleUser
          style={{
            color: "#e9ecef",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "100%",
            border: "1px solid #343a40",
          }}
        />
      }
    />
  );
};
