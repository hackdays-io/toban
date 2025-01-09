import { Box, Image } from "@chakra-ui/react";
import { type ReactNode, useEffect, useState } from "react";

interface CommonIconProps {
  imageUrl: string | undefined;
  size: number | `${number}px` | "full";
  borderRadius?: string;
  fallbackIconComponent?: ReactNode;
}

export const CommonIcon = ({
  size,
  imageUrl,
  fallbackIconComponent,
  borderRadius,
}: CommonIconProps) => {
  const [showFallbackIcon, setShowFallbackIcon] = useState(!imageUrl);

  useEffect(() => {
    setShowFallbackIcon(!imageUrl);
  }, [imageUrl]);

  return (
    <Box
      as="span"
      height={size}
      width={size}
      display="flex"
      alignItems="center"
      justifyContent="center"
      my="auto"
      borderRadius={borderRadius}
      flexShrink={0}
      overflow="hidden"
    >
      {!showFallbackIcon ? (
        <Image
          src={imageUrl}
          width="100%"
          height="100%"
          objectFit="cover"
          borderRadius={borderRadius}
          onError={() => setShowFallbackIcon(true)}
        />
      ) : (
        fallbackIconComponent || null
      )}
    </Box>
  );
};
