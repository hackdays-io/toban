"use client";

import {Box, Button, Flex, Heading, Spacer, VStack} from "@chakra-ui/react";
import {useParams, useRouter} from "next/navigation";
import React from "react";
import RoleCard from "../../../../components/RoleCard";
import {useGetHat} from "../../../../hooks";

export default function IndividualRoleList() {
  const router = useRouter();
  const {hatId} = useParams();
  // hatIdと詳細を取得する
  const {details, imageUri} = useGetHat(hatId as any);

  const handleNewButtonClick = () => {
    router.push("/app/SendToken/page");
  };

  const handleBackButtonClick = () => {
    router.push("/");
  };

  return (
    <>
      {/* Header */}
      <Box as="header" width="100%" position="relative" height="200px">
        <Flex
          position="absolute"
          top="0"
          left="0"
          right="0"
          p="4"
          alignItems="center"
          bg="rgba(0, 0, 0, 0.5)"
        >
          <Heading size="md" color="white">
            Individual Role List
          </Heading>
          <Spacer />
          <Button
            colorScheme="teal"
            variant="outline"
            onClick={handleBackButtonClick}
          >
            Back to Main Page
          </Button>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box p={5}>
        <VStack spacing={5}>
          <RoleCard
            name={details?.data.name || ""}
            description={details?.data.description || ""}
            imageUri={imageUri as any}
          />
          {/* <ShareList /> */}
          {/* <ShareChart /> */}
          {/* <RevokeButton /> */}
          <Button colorScheme="teal" size="md" onClick={handleNewButtonClick}>
            + Share My Fraction Token
          </Button>
        </VStack>
      </Box>
    </>
  );
}
