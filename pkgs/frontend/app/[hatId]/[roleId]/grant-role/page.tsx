"use client";

import {Box, Button, Flex, Heading, Spacer} from "@chakra-ui/react";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import Image from "next/image";
import {useParams, useRouter} from "next/navigation";
import NewRoleGrantedComponent from "@/components/NewRoleGranted";
import Header from "@/components/Header";

export default function NewRoleGranted() {
  const router = useRouter();

  return (
    <>
      <Header />

      {/* Main Content */}
      <Box mt="10">
        <NewRoleGrantedComponent />
      </Box>
    </>
  );
}
