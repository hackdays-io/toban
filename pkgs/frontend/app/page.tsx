import { Box, Button, Flex, Heading, Spacer, Text } from '@chakra-ui/react';

/**
 * Home component
 * @returns 
 */
export default function Home() {
  return (
    <>
      {/* Header */}
      <Flex as="header" p="4" bg="teal.500" color="white" alignItems="center">
        <Heading size="md">My App</Heading>
        <Spacer />
        <Button colorScheme="teal" variant="outline">
          Login
        </Button>
      </Flex>

      {/* Main Content */}
      <Box textAlign="center" mt="20">
        <Text fontSize="3xl" mb="4">Welcome</Text>
        <Button colorScheme="teal" size="md">
          Click Me
        </Button>
      </Box>
    </>
  );
}
