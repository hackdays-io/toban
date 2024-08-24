// import React from "react";
// import { Box, Button, Flex, Heading, Spacer, Text, VStack } from '@chakra-ui/react';
// import SplitterCreation from "../components/SplitterCreation";
// import NewRoleGranted from "../components/NewRoleGranted";
// import CreateRole from "../components/CreateRole";
// import SendToken from "../components/SendToken";

// export default function Home() {
//   return (
//     <>
//       {/* Header */}
//       <Flex as="header" p="4" bg="teal.500" color="white" alignItems="center">
//         <Heading size="md">My App</Heading>
//         <Spacer />
//         <Button colorScheme="teal" variant="outline">
//           Login
//         </Button>
//       </Flex>

//       {/* Main Content */}
//       <Box textAlign="center" mt="20">
//         <Text fontSize="3xl" mb="4">Welcome</Text>
//         <VStack spacing={4}>
//           <Button colorScheme="teal" size="md">
//             ButtonA
//           </Button>
//           <Button colorScheme="teal" size="md">
//             ButtonB
//           </Button>
//           <Button colorScheme="teal" size="md">
//             ButtonC
//           </Button>
//         </VStack>
//       </Box>

//       {/* SplitterCreation Component */}
//       <Box mt="10">
//         <SplitterCreation />
//       </Box>

//       {/* CreateRole Component */}
//       <Box mt="10">
//         <CreateRole />
//       </Box>

//       {/* NewRoleGranted Component */}
//       <Box mt="10">
//         <NewRoleGranted />
//       </Box>

//       {/* SendToken Component */}
//       <Box mt="10">
//         <SendToken />
//       </Box>
//     </>
//   );
// }

"use client"; // クライアントコンポーネントとして指定

import { Box, Button, Flex, Heading, Spacer, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image'; // next/imageのインポート
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

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
          <Heading size="md" color="white">My App</Heading>
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
        <VStack spacing={4}>
          <Button colorScheme="teal" size="md" onClick={() => navigateTo('/SplitterCreation')}>
            SplitterCreation
          </Button>
          <Button colorScheme="teal" size="md" onClick={() => navigateTo('/NewRoleGranted')}>
            NewRoleGranted
          </Button>
          <Button colorScheme="teal" size="md" onClick={() => navigateTo('/CreateRole')}>
            CreateRole
          </Button>
          <Button colorScheme="teal" size="md" onClick={() => navigateTo('/SendToken')}>
            SendToken
          </Button>
        </VStack>
      </Box>
    </>
  );
}
