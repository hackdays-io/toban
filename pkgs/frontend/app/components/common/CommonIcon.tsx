import { useState, useEffect, ReactNode } from "react";
import { Box, Image } from "@chakra-ui/react";

interface CommonIconProps {
  imageUrl: string | undefined;
  size: number | "full";
  fallbackIconComponent?: ReactNode;
}

export const CommonIcon = ({
  size,
  imageUrl,
  fallbackIconComponent,
}: CommonIconProps) => {
  const [showFallbackIcon, setShowFallbackIcon] = useState(!imageUrl);

  useEffect(() => {
    setShowFallbackIcon(!imageUrl);
  }, [imageUrl]);

  return (
    <Box
      height={size}
      width={size}
      display="flex"
      alignItems="center"
      justifyContent="center"
      my="auto"
      borderRadius="full"
      flexShrink={0}
      overflow="hidden"
    >
      {!showFallbackIcon ? (
        <Image
          src={imageUrl}
          width="100%"
          height="100%"
          objectFit="cover"
          borderRadius="full"
          onError={() => setShowFallbackIcon(true)}
        />
      ) : (
        fallbackIconComponent || null
      )}
    </Box>
  );
};
