"use client"; // クライアントコンポーネントとして指定

import { createTypedSignData } from '@/lib/metaTransaction';
import { Box, Button, Flex, Heading, Spacer, Text, VStack, useTheme } from '@chakra-ui/react';
import Image from 'next/image'; // next/imageのインポート
import { useRouter } from 'next/navigation';
import { useAccount, useChainId, useSignTypedData } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getWalletClient } from 'wagmi/actions';
import { wagmiConfig } from '@/lib/web3';
import useHatContractWrite, { ValidFunctionName } from '../hooks/useHatContractWrite';
import { useTopHatMint } from '@/hooks';

export default function Home() {
  const router = useRouter();
  const theme = useTheme(); // テーマを取得

  console.log(theme); // テーマオブジェクトの中身を確認

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const { address } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();

  const { writeAsync } = useTopHatMint({
    chainId,
    adminWearer: '0xYourAdminWearerAddress', // Replace with the actual admin wearer address
  });   

  const handleBigBangClick = async () => {
    try {
      const walletClient: any = await getWalletClient(wagmiConfig);
      const currentNetworkId = useChainId();
      const txDescription = `TopHatMinted hat to 0x${address}`;
      const imageURI = "ipfs://bafkreiflezpk3kjz6zsv23pbvowtatnd5hmqfkdro33x5mh2azlhne3ah4"
      const {
        writeAsync,
        isLoading,
      } = useHatContractWrite({
        functionName: 'mintHat' as ValidFunctionName,
        args: [walletClient, address, txDescription, imageURI],
        chainId,
        txDescription,
        enabled: chainId === currentNetworkId,
      });
      const res = await writeAsync();
      console.log(`😺 TopHat minted successfully ${res}`);
      navigateTo('/hatid');
    } catch (error) {
      console.error('Failed to mint TopHat:', error);
    }
  };

    /**
   * MetaTransactionを送信するメソッド
   */
    const sendMetaTx = async () => {
      console.log('sendMetaTransaction');
      // create typed sign data
      const typedSignData: any = await createTypedSignData(address, chainId as any, HELLO_WORLD_CONTRACT_ADDRESS, HelloWorldJson.abi, 'setNewText', ["test"]);

      // sign
      const signature = await signTypedDataAsync(typedSignData);
      console.log('signature', signature);
      // send meta transaction
      await fetch("api/requestRelayer", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          typedSignData: typedSignData,
          signature: signature,
        })
      }).then(async result => {
        // APIリクエストのリザルトをJSONとして解析
        console.log("API response:", await result.json());
      });
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
          <ConnectButton />
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
          <Button width="full" bg={"yellow"} color="black" size="md" onClick={() => handleBigBangClick()}>
            BigBang
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