import React, { FC, useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  Image,
  Flex,
  Heading,
} from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useAssignRole } from "../../hooks/useAssignRole";
import { Address } from "viem";
import { useAddressesByNames } from "hooks/useENS";
import { isValidEthAddress, abbreviateAddress } from "utils/wallet";

const AssignRole: FC = () => {
  const { treeId, hatId } = useParams();
  // In case you need hatId internally, you can use it from here, but we won't display it.
  // const parsedHatId = hatId ? BigInt(hatId) : undefined;

  // User input for name or address
  const [inputValue, setInputValue] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<Address | null>(null);

  // Date input: default to today's date
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const { assignRole, isAssigning, assignError, assignSuccess } =
    useAssignRole();

  // Name resolution
  const { addresses, fetchAddresses } = useAddressesByNames();

  useEffect(() => {
    setResolvedAddress(null);
    if (!inputValue) return;

    if (isValidEthAddress(inputValue)) {
      // Valid Ethereum address directly
      setResolvedAddress(inputValue as Address);
    } else if (!inputValue.startsWith("0x")) {
      // Attempt name resolution
      fetchAddresses([inputValue]);
    }
  }, [inputValue, fetchAddresses]);

  useEffect(() => {
    // If we got a resolved result
    if (addresses && addresses.length > 0 && addresses[0].length > 0) {
      const resolved = addresses[0][0];
      if (resolved && resolved.address) {
        setResolvedAddress(resolved.address as Address);
      }
    }
  }, [addresses]);

  const handleAssign = () => {
    let finalAddress: Address | null = null;

    if (isValidEthAddress(inputValue)) {
      finalAddress = inputValue as Address;
    } else if (resolvedAddress) {
      finalAddress = resolvedAddress;
    } else {
      alert("Please enter a valid Ethereum address or a resolvable username.");
      return;
    }

    // Assuming you have logic to handle hatId inside useAssignRole or mintHat
    // If hatId is required, ensure your assignRole logic doesn't rely on UI input.
    assignRole({
      hatId: hatId ? BigInt(hatId) : 0n, // or handle no hatId scenario
      wearer: finalAddress,
    });
  };

  // Theming:
  // - Background: #FFF8E5 (cream)
  // - Accent: #FFD266 (warm yellow)
  // Adopting a layout similar to the "Assign role" image:
  return (
    <Flex justify="center" align="center" minH="100vh" bg="#FFF8E5" p={4}>
      <Box
        w={{ base: "100%", sm: "400px" }}
        bg="white"
        borderRadius="lg"
        boxShadow="md"
        p={6}
      >
        {/* Header with logo and user avatar */}
        <HStack justify="space-between" mb={6}>
          <HStack>
            <Image
              src="https://via.placeholder.com/40?text=Logo"
              borderRadius="md"
              boxSize="40px"
              alt="Hackdays Logo"
            />
            <Text fontWeight="bold" fontSize="lg">
              Hackdays
            </Text>
          </HStack>
          <Image
            src="https://via.placeholder.com/40"
            borderRadius="full"
            boxSize="40px"
            alt="User Avatar"
          />
        </HStack>

        <Heading as="h2" fontSize="xl" mb={4}>
          Assign Role
        </Heading>

        {/* Role Icon and Description */}
        <VStack align="start" mb={6}>
          <Image
            src="https://via.placeholder.com/80?text=Role"
            boxSize="80px"
            borderRadius="md"
            alt="Role Icon"
          />
          <Text fontWeight="bold" fontSize="lg">
            掃除係
          </Text>
          <Text fontSize="sm" color="gray.600">
            説明説明説明説明説明説明説明説明 説明説明説明説明説明説明説明説明
            説明説明説明説明説明説明
          </Text>
        </VStack>

        {/* User name or address input */}
        <Box mb={4}>
          <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">
            ユーザー名 or ウォレットアドレス
          </Text>
          <Input
            placeholder="ユーザー名 or ウォレットアドレス"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            size="md"
            variant="outline"
          />
          {resolvedAddress && !isValidEthAddress(inputValue) && (
            <Text fontSize="xs" mt={1} color="gray.500">
              {abbreviateAddress(resolvedAddress)}
            </Text>
          )}
        </Box>

        {/* Date input */}
        <Box mb={4}>
          <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">
            開始日
          </Text>
          <Input type="date" defaultValue={today} size="md" variant="outline" />
        </Box>

        {/* Assign Button */}
        <Button
          onClick={handleAssign}
          bg="#FFD266"
          color="black"
          w="100%"
          size="lg"
          isLoading={isAssigning}
          disabled={isAssigning}
          _hover={{ bg: "#FFC94D" }}
        >
          Assign
        </Button>

        {/* Feedback messages */}
        {isAssigning && <Text mt={4}>Assigning role... Please wait.</Text>}
        {assignError && (
          <Text mt={4} color="red.500">
            Error: {assignError}
          </Text>
        )}
        {assignSuccess && (
          <Text mt={4} color="green.500">
            Role assigned successfully!
          </Text>
        )}
      </Box>
    </Flex>
  );
};

export default AssignRole;
