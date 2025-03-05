import { Box, Text } from "@chakra-ui/react";
import type { FC, ReactNode } from "react";

export const SettingsSection: FC<{
  children: ReactNode;
  headingText: string;
}> = ({ children, headingText }) => (
  <Box mt={2} mb={12}>
    <Text fontSize="md" fontWeight="medium" color="gray.600">
      {headingText}
    </Text>
    {children}
  </Box>
);

export const SettingsSubSection: FC<{
  children: ReactNode;
  headingText: string;
}> = ({ children, headingText }) => (
  <Box mt={3} mb={5}>
    <Text mb={3} fontSize="sm" fontWeight="medium" color="gray.600">
      {headingText}
    </Text>
    {children}
  </Box>
);
