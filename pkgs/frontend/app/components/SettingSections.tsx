import type { FC } from "react";
import { Box, Text } from "~/components/chakra-shim";

export const SettingsSection: FC<{
  children: React.ReactNode;
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
  children: React.ReactNode;
  headingText: string;
}> = ({ children, headingText }) => (
  <Box mt={3} mb={5}>
    <Text mb={3} fontSize="sm" fontWeight="medium" color="gray.600">
      {headingText}
    </Text>
    {children}
  </Box>
);
