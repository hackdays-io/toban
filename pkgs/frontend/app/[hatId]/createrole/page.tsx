"use client";

import CreateRoleComponent from "@/components/CreateRole";
import Header from "@/components/Header";
import {Box, Button, Flex, Heading, Spacer} from "@chakra-ui/react";
import {ConnectButton} from "@rainbow-me/rainbowkit";
import Image from "next/image"; // next/imageのインポート
import {useRouter} from "next/navigation";

export default function CreateRole() {
  const router = useRouter();

  return (
    <>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <Box textAlign="center" mt="20">
        <CreateRoleComponent />
      </Box>
    </>
  );
}
