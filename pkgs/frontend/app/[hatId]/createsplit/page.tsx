"use client";

import {Box, Button, Flex, Heading, Spacer} from "@chakra-ui/react";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import Image from "next/image";
import {useRouter} from "next/navigation";
import SplitterCreationComponent from "@/components/SplitterCreation";
import Header from "@/components/Header";

export default function SplitterCreation() {
  const router = useRouter();

  return (
    <>
      <Header />

      {/* Main Content */}
      <Box textAlign="center" mt="20">
        <SplitterCreationComponent />
      </Box>
    </>
  );
}
