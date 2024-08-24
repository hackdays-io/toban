"use client";

import React from 'react';
import { Box, VStack, Button, Flex, Heading, Spacer } from "@chakra-ui/react";
import { useRouter } from 'next/navigation';
import RoleCard from "../components/RoleCard";
import ShareList from "../components/ShareList";
import ShareChart from "../components/ShareChart";
import RevokeButton from "../components/RevokeButton";

export default function IndividualRoleList() {
  const router = useRouter();

  const handleNewButtonClick = () => {
    router.push('/app/SendToken/page');
  };

  const handleBackButtonClick = () => {
    router.push('/');
  };

  return (
    <>
      {/* Header */}
      <Box as="header" width="100%" position="relative" height="200px">
        <Flex position="absolute" top="0" left="0" right="0" p="4" alignItems="center" bg="rgba(0, 0, 0, 0.5)">
          <Heading size="md" color="white">Individual Role List</Heading>
          <Spacer />
          <Button colorScheme="teal" variant="outline" onClick={handleBackButtonClick}>
            Back to Main Page
          </Button>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box p={5}>
        <VStack spacing={5}>
          <RoleCard />
          <ShareList />
          <ShareChart />
          <RevokeButton />
          <Button colorScheme="teal" size="md" onClick={handleNewButtonClick}>
            + New
          </Button>
        </VStack>
      </Box>
    </>
  );
}
