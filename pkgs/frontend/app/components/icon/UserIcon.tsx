import { useEffect, useState } from "react";
import { FaCircleUser } from "react-icons/fa6";
import { ipfs2https } from "utils/ipfs";
import { CommonIcon } from "../common/CommonIcon";

interface UserIconProps {
  userImageUrl?: string;
  size?: number | `${number}px` | "full";
}

export const UserIcon = ({ userImageUrl, size = "full" }: UserIconProps) => {
  const [imageUrl, setImageUrl] = useState<string>();

  useEffect(() => {
    if (userImageUrl?.includes("ipfs://")) {
      setImageUrl(ipfs2https(userImageUrl));
    } else {
      setImageUrl(userImageUrl);
    }
  }, [userImageUrl]);

  return (
    <CommonIcon
      imageUrl={imageUrl}
      size={size}
      borderRadius="full"
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
