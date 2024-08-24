"use client";

import Header from "@/components/Header";
import {useGetHat} from "@/hooks/useHatRead";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Image,
  Tag,
  VStack,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import Link from "next/link";
import {useParams, useRouter} from "next/navigation";
import {useMemo} from "react";

const RoleList = () => {
  const router = useRouter();

  const {hatId, roleId} = useParams();

  const contributors = [
    {name: "halsk.eth", isCore: true},
    {name: "0xyyy...123", isCore: true},
    {name: "0xtkd...adt", isCore: false},
    {name: "bob.eth", isCore: false},
  ];

  const {details, imageUri} = useGetHat(BigInt(roleId.toString()));

  const pinataImageUri = useMemo(() => {
    return imageUri?.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
  }, [imageUri]);

  return (
    <>
      <Header />
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
            src={pinataImageUri}
            alt="Role Icon"
            boxSize="80px"
            borderRadius="full"
            mr={4}
          />
          <VStack align="start">
            <Heading as="h1" size="lg">
              {details?.data.name}
            </Heading>
            <Text color="gray.600">{details?.data.description}</Text>
          </VStack>
        </Flex>

        <Box mb={8}>
          <Heading as="h2" size="md" mb={4}>
            Work Scope
          </Heading>
          <VStack align="start" spacing={2}>
            <UnorderedList>
              {details?.data.responsabilities?.map((responsability, index) => (
                <ListItem key={index}>
                  <Text>{responsability.label}</Text>
                  <Text>{responsability.description}</Text>
                </ListItem>
              ))}
            </UnorderedList>
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
    </>
  );
};

export default RoleList;
