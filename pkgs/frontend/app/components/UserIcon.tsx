import { FaCircleUser } from "react-icons/fa6";
import { CommonIcon } from "./common/CommonIcon";

interface UserIconProps {
  userImageUrl: string | undefined;
  size: number;
}

export const UserIcon = ({ userImageUrl, size }: UserIconProps) => {
  return (
    <CommonIcon
      imageUrl={userImageUrl}
      size={size}
      fallbackIconComponent={
        <FaCircleUser
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      }
    />
  );
};
