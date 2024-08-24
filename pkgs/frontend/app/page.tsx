"use client"; // クライアントコンポーネントとして指定

import React, { useEffect, useState } from 'react';
import { Box, Button, Flex, Heading, Spacer, Text, VStack } from '@chakra-ui/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useHatMint, useTopHatMint } from '@/hooks';
import useHatterHatMint from '@/hooks/useHatterHatMint';
import { delay, removeTrailingN } from '@/lib/utils';

export default function Home() {
  const router = useRouter();

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const chainId = useChainId();
  
  const [topHatId, setTopHatId] = useState<bigint>(BigInt(0));
  const [hatterHatId, setHatterHatId] = useState<bigint>(BigInt(0));

  const resTopHatMint = useTopHatMint({
    chainId,
  });

  const resHatterHatMint = useHatterHatMint({
    chainId,
    hatId: topHatId
  });

  const resHatMint = useHatMint({
    chainId,
    hatId: hatterHatId
  });

  const handleBigBangClick = async () => {
    try {
      const bigbang1 = await resTopHatMint.writeAsync()
      setTopHatId(bigbang1)
      console.log(`😺 TopHat minted successfully!, hatId = ${bigbang1}`);

      

      // const bigbang3 = await resHatMint.writeAsync()
      // console.log('bigbang3', bigbang3);

      // if (res === '1n'){
      //   navigateTo('/hatid');
      // }
      
    } catch (error) {
      console.error('Failed to mint TopHat:', error);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      const bigbang2 = await resHatterHatMint.writeAsync()
        setHatterHatId(bigbang2)
        console.log(`😺 HatterHat minted successfully!, hatId = ${bigbang2}`)
    }
    fetch()
  }, [topHatId])

  return (
    <Box bg="#FFFCF4" minH="100vh"> {/* 背景色を#FFFCF4に設定 */}
      {/* Header */}
      <Box as="header" width="100%" position="relative" height="200px">
        <Image 
          src="/header.png" 
          alt="Header Image" 
          layout="fill" 
          objectFit="cover" 
          priority={true}
        />
        <Flex position="absolute" top="0" left="0" right="0" p="4" alignItems="center" bg="rgba(0, 0, 0, 0.5)">
          <Heading size="md" color="white">Main Page</Heading>
          <Spacer />
          <ConnectButton />
        </Flex>
      </Box>

      {/* Main Content */}
      <Box textAlign="center" mt="20">
        <Text fontSize="3xl" color="black" mb="4">Welcome</Text>
        <VStack spacing={4} width="full" maxW="400px" mx="auto">
          <Button width="full" bg="black" color="white" size="md" onClick={() => navigateTo('/ProjectTop')}>
            ProjectTop
          </Button>
          <Button width="full" bg="yellow.400" color="black" size="md" onClick={() => navigateTo('/CreateRole')}>
            CreateRole
          </Button>
          <Button width="full" bg="blue.400" color="black" size="md" onClick={() => navigateTo('/NewRoleGranted')}>
            NewRoleGranted
          </Button>
          <Button width="full" bg="orange.400" color="black" size="md" onClick={() => navigateTo('/SendToken')}>
            SendToken
          </Button>
          <Button width="full" bg="green.400" color="black" size="md" onClick={() => navigateTo('/SplitterCreation')}>
            SplitterCreation
          </Button>
          <hr/>
          <Button width="full" bg={"yellow"} color="black" size="md" onClick={() => handleBigBangClick()}>
            BigBang
          </Button>
        </VStack>
      </Box>
    </Box>
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