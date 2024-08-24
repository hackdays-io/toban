"use client"; // クライアントコンポーネントとして指定

import { useHatMint, useTopHatMint } from '@/hooks';
import useHatterHatMint from '@/hooks/useHatterHatMint';
import { Box, Button, Flex, Heading, Spacer, Text, VStack } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';

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

  useEffect(() => {
    const fetch = async () => {
      const bigbang3 = await resHatMint.writeAsync()
      console.log(`😺 HatterHat minted successfully!, amount = ${bigbang3}`)

      if (Number(bigbang3) === 1){
        navigateTo(`/${topHatId}`)
      }
    }
    fetch()
  }, [hatterHatId])

  return (
    <Box bg="#FFFCF4" minH="100vh" position="relative" overflowX="hidden">
      {/* Background Design */}
      <Image 
        src="/wave.png" 
        alt="Wave Design"
        position="absolute"
        top="0"
        right="0"  
        // @ts-ignore
        width="60%"  
        // @ts-ignore
        height="100%"
        objectFit="cover"  
        zIndex="0"
      />

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
      <Box textAlign="left" mt="10" zIndex="2" ml="10%">
        <Image 
          src="/toban_logo_color_middle.png" 
          alt="Toban Logo Middle" 
          // @ts-ignore
          height="100px"
          // @ts-ignore
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
          // @ts-ignore
          width="100%"
          // @ts-ignore
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
          <hr/>
          <Button width="full" bg={"yellow"} color="black" size="md" onClick={() => handleBigBangClick()}>
            BigBang
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
