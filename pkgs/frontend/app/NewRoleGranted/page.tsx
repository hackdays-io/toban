"use client";

import React from 'react';
import { Box, Button, Flex, Heading, Spacer } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import NewRoleGrantedComponent from '../../components/NewRoleGranted';

export default function NewRoleGranted() {
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
                    <Heading size="md" color="white">New Role Granted</Heading>
                    <Spacer />
                    <Button colorScheme="teal" variant="outline" onClick={() => router.push('/')}>
                        メインページに戻る
                    </Button>
                </Flex>
            </Box>

            {/* Main Content */}
            <Box textAlign="center" mt="20">
                <NewRoleGrantedComponent />
            </Box>
        </>
    );
}
