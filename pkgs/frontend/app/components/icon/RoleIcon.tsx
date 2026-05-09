import { type FC, useEffect, useState } from "react";
import { MdOutlineBadge } from "react-icons/md";
import { ipfs2https } from "utils/ipfs";
import { isLegacyRoleImageUri } from "utils/legacyRoleImages";
import { CommonIcon } from "../common/CommonIcon";

interface RoleIconProps {
  roleImageUrl?: string;
  size?: number | `${number}px` | "full";
  borderRadius?: string;
}

export const RoleIcon: FC<RoleIconProps> = ({
  roleImageUrl,
  size = "full",
  borderRadius = "xl",
}) => {
  const [imageUrl, setImageUrl] = useState<string>();

  useEffect(() => {
    if (isLegacyRoleImageUri(roleImageUrl)) {
      setImageUrl(undefined);
    } else if (roleImageUrl?.includes("ipfs://")) {
      setImageUrl(ipfs2https(roleImageUrl));
    } else {
      setImageUrl(roleImageUrl);
    }
  }, [roleImageUrl]);

  return (
    <CommonIcon
      imageUrl={imageUrl}
      size={size}
      borderRadius={borderRadius}
      fallbackIconComponent={
        <MdOutlineBadge
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
