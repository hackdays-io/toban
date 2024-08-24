"use client"; // クライアントコンポーネントとして指定

import { Box, Button, Flex, Heading, Spacer, Text, VStack, useTheme } from '@chakra-ui/react';
import Image from 'next/image'; // next/imageのインポート
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const theme = useTheme(); // テーマを取得

  console.log(theme); // テーマオブジェクトの中身を確認

  const navigateTo = (path: string) => {
    router.push(path);
  };

  return (
    <>
      {/* Header */}
      <Box as="header" width="100%" position="relative" height="200px">
        <Image 
          src="/header.png" 
          alt="Header Image" 
          layout="fill" 
          objectFit="cover" // 画像をカバーするように表示
          priority={true} // ページロード時に優先的に読み込む
        />
        <Flex position="absolute" top="0" left="0" right="0" p="4" alignItems="center" bg="rgba(0, 0, 0, 0.5)">
          <Heading size="md" color="white">Main Page</Heading>
          <Spacer />
          <Button 
            colorScheme="teal" 
            variant="outline"
          >
            Login
          </Button>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box textAlign="center" mt="20">
        <Text fontSize="3xl" mb="4">Welcome</Text>
        <VStack spacing={4} width="full" maxW="400px" mx="auto">
          <Button width="full" bg={theme.colors.yellow[400]} color="black" size="md" onClick={() => navigateTo('/CreateRole')}>
            CreateRole
          </Button>
          <Button width="full" bg={theme.colors.blue[400]} color="black" size="md" onClick={() => navigateTo('/NewRoleGranted')}>
            NewRoleGranted
          </Button>
          <Button width="full" bg={theme.colors.orange[400]} color="black" size="md" onClick={() => navigateTo('/SendToken')}>
            SendToken
          </Button>
          <Button width="full" bg={theme.colors.blue[400]} color="black" size="md" onClick={() => navigateTo('/SplitterCreation')}>
            SplitterCreation
          </Button>
          <hr/>
          <Button width="full" bg={"yellow"} color="black" size="md" onClick={() => { console.log('😺'); navigateTo('/hatid');}}>
            Bigbang
          </Button>
        </VStack>
      </Box>

    </>
  );
}


      // {/* Main Content */}
      // <Box textAlign="center" mt="20">
      //   <Text fontSize="3xl" mb="4">Welcome</Text>
      //   <Box
      //     position="relative"
      //     width="300px"
      //     height="300px"
      //     mx="auto"
      //     borderRadius="50%"
      //     overflow="hidden"
      //     display="flex"
      //     flexWrap="wrap"
      //   >
      //     <Button
      //       position="absolute"
      //       top="0"
      //       left="0"
      //       width="50%"
      //       height="50%"
      //       bg="yellow.400"
      //       borderRadius="0"
      //       onClick={() => navigateTo('/CreateRole')}
      //     >
      //       CreateRole
      //     </Button>
      //     <Button
      //       position="absolute"
      //       top="0"
      //       left="50%"
      //       width="50%"
      //       height="50%"
      //       bg="orange.400"
      //       borderRadius="0"
      //       onClick={() => navigateTo('/NewRoleGranted')}
      //     >
      //       NewRoleGranted
      //     </Button>
      //     <Button
      //       position="absolute"
      //       top="50%"
      //       left="0"
      //       width="50%"
      //       height="50%"
      //       bg="blue.400"
      //       borderRadius="0"
      //       onClick={() => navigateTo('/SendToken')}
      //     >
      //       SendToken
      //     </Button>
      //     <Button
      //       position="absolute"
      //       top="50%"
      //       left="50%"
      //       width="50%"
      //       height="50%"
      //       bg="teal.400"
      //       borderRadius="0"
      //       onClick={() => navigateTo('/SplitterCreation')}
      //     >
      //       SplitterCreation
      //     </Button>
      //   </Box>
      // </Box>