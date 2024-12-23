import { Box } from "@chakra-ui/react";

export const ContentContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {children}
    </Box>
  );
};
