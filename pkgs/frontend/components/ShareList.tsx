import { Box, Text } from "@chakra-ui/react";

const ShareList = () => {
  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" maxW="sm">
      <Text fontWeight="bold" fontSize="md">Worked with</Text>
      <ul>
        <li>0x876...aaa</li>
        <li>vitalik.eth</li>
        <li>halsk.eth</li>
      </ul>
    </Box>
  );
};

export default ShareList;
