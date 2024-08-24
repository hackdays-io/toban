"use client";

import {useGetHats, useGetMyRoles} from "@/hooks/useHatRead";
import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Spacer,
  Text,
} from "@chakra-ui/react";
import {useParams, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {useAccount} from "wagmi";
import HatList from "../../components/HatList";
import ProjectInfo from "../../components/ProjectInfo";
import RoleList from "../../components/RoleList";
import Header from "@/components/Header";

export default function ProjectTop() {
  const [hatsInfos, setHatsInfos] = useState<any[]>([]);

  const {isConnected} = useAccount();
  const {hatId} = useParams();
  const {topHat, roleHats} = useGetHats(hatId.toString());
  const {myRoles} = useGetMyRoles();

  useEffect(() => {
    if (roleHats != undefined) {
      const formattedRoles = roleHats.map((role) => {
        const name = role.parsedData.parsedData.data.name;
        const imageUri = role.imageUri.replace(
          "ipfs://",
          "https://gateway.pinata.cloud/ipfs/"
        );

        setHatsInfos((prev) => [
          ...prev,
          {
            name: name,
            icon: imageUri,
            href: `/${hatId}/${BigInt(role.id).toString()}`,
          },
        ]);
      });
      formattedRoles;
    }
  }, [roleHats]);

  return (
    <>
      <Header />

      {/* Main Content */}
      <Center py={10} px={6}>
        <Box
          maxW="lg"
          w="full"
          bg="white"
          color="black.500"
          p={8}
          borderRadius="lg"
          boxShadow="lg"
        >
          <ProjectInfo
            members={15}
            splitters={2}
            projectName={topHat?.data.name}
            projectDescription={topHat?.data.description}
          />

          {isConnected && <HatList items={myRoles} />}

          <Text fontSize="2xl" fontWeight="bold" mt={10}>
            Project Roles
          </Text>
          <RoleList roles={hatsInfos} hatId={hatId.toString()} />
        </Box>
      </Center>
    </>
  );
}
