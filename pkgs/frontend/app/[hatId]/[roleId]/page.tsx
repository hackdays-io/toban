"use client";

import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Image,
  Tag,
  VStack,
} from "@chakra-ui/react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";

const RoleList = () => {
  const router = useRouter();

  const {hatId, roleId} = useParams();

  const contributors = [
    {name: "halsk.eth", isCore: true},
    {name: "0xyyy...123", isCore: true},
    {name: "0xtkd...adt", isCore: false},
    {name: "bob.eth", isCore: false},
  ];

  return (
    <Box
      p={8}
      maxW="600px"
      mx="auto"
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
    >
      <Flex alignItems="center" mb={8}>
        <Image
          src="/path/to/your/image.png" // 実際の画像パスに置き換えてください
          alt="Role Icon"
          boxSize="80px"
          borderRadius="full"
          mr={4}
        />
        <VStack align="start">
          <Heading as="h1" size="lg">
            Food
          </Heading>
          <Text color="gray.600">
            Lorem Ipsum is just dummy text for the printing and typesetting
            industry.
          </Text>
        </VStack>
      </Flex>

      <Box mb={8}>
        <Heading as="h2" size="md" mb={4}>
          Work Scope
        </Heading>
        <VStack align="start" spacing={2}>
          <Text>- Cleaning public spaces</Text>
          <Text>- Planning cleaning challenge</Text>
          <Text>- Responsible for cleaning</Text>
        </VStack>
      </Box>

      <Box>
        <Heading as="h2" size="md" mb={4}>
          Contributors
        </Heading>
        <VStack align="start" spacing={4}>
          {contributors.map((contributor, index) => (
            <Flex key={index} alignItems="center">
              <Text mr={4}>{contributor.name}</Text>
              {contributor.isCore && <Tag colorScheme="red">Core</Tag>}
            </Flex>
          ))}
          <Link href={`/${hatId}/${roleId}/grant-role`}>
            <Button colorScheme="green" mt={4}>
              + Core Contributor
            </Button>
          </Link>
        </VStack>
      </Box>
    </Box>
  );
};

export default RoleList;
