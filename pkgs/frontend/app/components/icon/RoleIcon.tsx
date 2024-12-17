import { FaCircle, FaPeopleGroup } from "react-icons/fa6";
import { CommonIcon } from "../common/CommonIcon";
import { useEffect, useState } from "react";
import { ipfs2https } from "utils/ipfs";

interface RoleIconProps {
  roleImageUrl?: string;
  size?: number | `${number}px` | "full";
}

export const RoleIcon = ({ roleImageUrl, size = "full" }: RoleIconProps) => {
  const [imageUrl, setImageUrl] = useState<string>();

  useEffect(() => {
    if (roleImageUrl?.includes("ipfs://")) {
      setImageUrl(ipfs2https(roleImageUrl));
    } else {
      setImageUrl(roleImageUrl);
    }
  }, [roleImageUrl]);

  return (
    <CommonIcon
      imageUrl={imageUrl}
      size={size}
      fallbackIconComponent={
        <FaCircle
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
