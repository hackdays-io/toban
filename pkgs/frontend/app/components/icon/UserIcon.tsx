import { CommonIcon } from "../common/CommonIcon";
import { DefaultUserIcon } from "./DefaultUserIcon";

interface UserIconProps {
  userImageUrl: string | undefined;
  size?: number | "full";
}

export const UserIcon = ({ userImageUrl, size = "full" }: UserIconProps) => {
  return (
    <CommonIcon
      imageUrl={userImageUrl}
      size={size}
      fallbackIconComponent={<DefaultUserIcon />}
    />
  );
};
