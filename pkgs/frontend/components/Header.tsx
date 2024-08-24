"use client"; // クライアントコンポーネントとして指定

import { Box, Flex, Image, Spacer } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
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
        <Image
          src="/toban_logo_color_top.png"
          alt="Toban Logo"
          height="50px"
          width="auto"
          objectFit="contain"
        />
        <Spacer />
        <ConnectButton />
      </Flex>
    </Box>
  );
}
