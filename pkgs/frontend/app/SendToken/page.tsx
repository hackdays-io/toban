"use client";

import { Box, Button, Flex, Heading, Spacer } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SendTokenComponent from '../../components/SendToken';

export default function SendToken() {
    const router = useRouter();
    
    return (
        <>
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
                    <Heading size="md" color="white">Send Token</Heading>
                    <Spacer />
                    <ConnectButton />
                    <Button colorScheme="teal" variant="outline" onClick={() => router.push('/')}>
                        Back to Main Page
                    </Button>
                </Flex>
            </Box>

            {/* Main Content */}
            <Box textAlign="center" mt="20">
                <SendTokenComponent />
            </Box>
        </>
    );
}
