"use client"; // クライアントコンポーネントとして指定

import { Box, Button, Flex, Heading, Spacer, Text, VStack, Image } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <Box bg="#FFFCF4" minH="100vh" position="relative" overflowX="hidden">
      {/* Background Design */}
      <Image 
        src="/wave.png" 
        alt="Wave Design"
        position="absolute"
        top="0"
        right="0"  
        width="60%"  
        height="100%"
        objectFit="cover"  
        zIndex="0"
      />

      {/* Header */}
      <Box as="header" width="100%" position="relative" height="120px" zIndex="2">
        <Flex alignItems="center" justifyContent="space-between" p="4">
          <Image 
            src="/toban_logo_color_top.png" 
            alt="Toban Logo Top" 
            height="50px"
            width="auto"
            objectFit="contain"  
          />
          <Button 
            colorScheme="teal" 
            variant="outline"
          >
            Login
          </Button>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box textAlign="left" mt="10" zIndex="2" ml="10%">
        <Image 
          src="/toban_logo_color_middle.png" 
          alt="Toban Logo Middle" 
          height="100px"
          width="auto"
          objectFit="contain"  
          mb="4"
        />
        <Heading size="lg" color="#333" mb={2}>
          いちばん簡単な貢献の記録と報酬の分配
        </Heading>
        <Text fontSize="md" color="#555" mb={10}>
          Simplest way to contribution recording and rewards distribution
        </Text>
      </Box>

      <Box position="relative" zIndex="1" mt="50px">
        <Image 
          src="/obi.png" 
          alt="Background Design"
          width="100%"
          height="auto"
          objectFit="contain"
          zIndex="1"
        />
      </Box>

      <Box textAlign="center" zIndex="2" mt="100px" pb="100px">
        <VStack spacing={4} width="full" maxW="400px" mx="auto">
          <Button width="full" bg="black" color="white" size="lg" onClick={() => navigateTo('/ProjectTop')}>
            ProjectTop
          </Button>
          <Button width="full" bg="yellow.400" color="black" size="lg" onClick={() => navigateTo('/CreateRole')}>
            CreateRole
          </Button>
          <Button width="full" bg="blue.400" color="white" size="lg" onClick={() => navigateTo('/NewRoleGranted')}>
            NewRoleGranted
          </Button>
          <Button width="full" bg="orange.400" color="black" size="lg" onClick={() => navigateTo('/SendToken')}>
            SendToken
          </Button>
          <Button width="full" bg="green.400" color="black" size="lg" onClick={() => navigateTo('/SplitterCreation')}>
            SplitterCreation
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
