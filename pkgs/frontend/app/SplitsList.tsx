import { Box, Button, Flex, Text, VStack, HStack, Badge, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const SplitterList = () => {
  const router = useRouter();

  // ダミーデータを使用したスプリッターリスト
  const splitters = [
    {
      name: '2024 Q3 Rewards',
      members: 15,
      createdAt: '2024/7/15',
      chain: 'Optimism',
      address: '0xabc89dsakdfasdfasdd123sdafsdfasdf'
    },
    // 必要に応じて他のスプリッターのデータを追加
  ];

  return (
    <Box p={4}>
      <Button
        colorScheme="green"
        onClick={() => router.push('/app/SplitterCreation')}
        mb={4}
      >
        + New Splitter
      </Button>
      <VStack spacing={4} align="stretch">
        {splitters.map((splitter, index) => (
          <Box
            key={index}
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            p={4}
            bg={useColorModeValue('white', 'gray.800')}
          >
            <HStack justifyContent="space-between">
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {splitter.name}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  作成日: {splitter.createdAt}
                </Text>
                <HStack mt={2}>
                  <Badge colorScheme="red" px={2} py={1}>
                    {splitter.chain}
                  </Badge>
                  <Text fontSize="sm" wordBreak="break-all">
                    {splitter.address}
                  </Text>
                </HStack>
              </Box>
              <VStack alignItems="end">
                <Text fontSize="xl">👔</Text>
                <Text>x{splitter.members}</Text>
              </VStack>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default SplitterList;
