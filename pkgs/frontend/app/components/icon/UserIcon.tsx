import { useEffect, useState } from "react";
import { FaCircleUser } from "react-icons/fa6";
import { ipfs2https } from "utils/ipfs";

interface UserIconProps {
  userImageUrl?: string;
  /**
   * Pixel size (number → `${n}px`, string → used as-is, "full" → 100%).
   * Defaults to "full" so the icon fills its parent.
   */
  size?: number | `${number}px` | "full";
}

const resolveSize = (size: UserIconProps["size"]): string => {
  if (size === "full" || size === undefined) return "100%";
  if (typeof size === "number") return `${size}px`;
  return size;
};

export const UserIcon = ({ userImageUrl, size = "full" }: UserIconProps) => {
  const [imageUrl, setImageUrl] = useState<string>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (userImageUrl?.includes("ipfs://")) {
      setImageUrl(ipfs2https(userImageUrl));
    } else {
      setImageUrl(userImageUrl);
    }
  }, [userImageUrl]);

  const dimension = resolveSize(size);
  const showFallback = !imageUrl || failed;

  return (
    <span
      className="my-auto inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{
        width: dimension,
        height: dimension,
        backgroundColor: showFallback ? "#d1d5db" : "transparent",
      }}
    >
      {showFallback ? (
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
      ) : (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full rounded-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
};
