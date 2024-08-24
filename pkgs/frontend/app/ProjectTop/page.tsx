"use client";

import React from 'react';
import { Box, Button, Flex, Heading, Spacer, Center } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProjectInfo from '../../components/ProjectInfo';
import RoleList from '../../components/RoleList';
import HatList from '../../components/HatList';

export default function ProjectTop() {
    const router = useRouter();
    
    const isWalletConnected = false; // 実際のウォレット接続ロジックと置き換えてください

    const roles = [
        { name: 'Cleaning', icon: '🧹', href: '/roles/cleaning' },
        { name: 'Committee', icon: '🧑‍💼', href: '/roles/committee' },
        { name: 'Contents', icon: '📝', href: '/roles/contents' },
        { name: 'Food', icon: '🍴', href: '/roles/food' },
    ];

    const hats = [
        { name: 'Hat 1', href: '/hats/1' },
        { name: 'Hat 2', href: '/hats/2' },
    ];

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
                    <Heading size="md" color="white">Project Top</Heading>
                    <Spacer />
                    <Button colorScheme="teal" variant="outline" onClick={() => router.push('/')}>
                        Back to Main Page
                    </Button>
                </Flex>
            </Box>

            {/* Main Content */}
            <Center py={10} px={6} bg="gray.900">
                <Box 
                    maxW="lg" 
                    w="full" 
                    bg="gray.700" 
                    color="white" 
                    p={8} 
                    borderRadius="lg" 
                    boxShadow="lg"
                >
                    <ProjectInfo members={15} splitters={2} />
                    <RoleList roles={roles} />
                    {isWalletConnected && <HatList hats={hats} />}
                </Box>
            </Center>
        </>
    );
}
