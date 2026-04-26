import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import type { FC } from "react";
import { CommonIcon } from "./common/CommonIcon";

export const SmartWalletLoading: FC = () => {
  return (
    <Flex
      direction="column"
      justifyContent="center"
      alignItems="center"
      h="calc(100vh - 72px)"
      gap={6}
    >
      <Box width="120px">
        <CommonIcon size="full" imageUrl="/images/toban-logo.svg" />
      </Box>
      <Spinner size="lg" color="yellow.500" borderWidth="3px" />
      <Text color="gray.700" fontSize="sm">
        ウォレットを準備しています...
      </Text>
    </Flex>
  );
};
