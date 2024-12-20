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
import { useGetHat } from "hooks/useHats";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { HatsDetailSchama } from "types/hats";
import { RoleIcon } from "~/components/icon/RoleIcon";
import { CommonInput } from "~/components/common/CommonInput";

interface RoleDetailProps {
  imageUri?: string;
  detail?: HatsDetailSchama;
}

const RoleDetail: FC<RoleDetailProps> = ({ imageUri, detail }) => {
  return (
    <HStack align="start" mb={6} columnGap={4}>
      <RoleIcon roleImageUrl={imageUri} size={20} />
      <Box>
        <Text fontWeight="bold" fontSize="lg">
          {detail?.data.name}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {detail?.data.description}
        </Text>
      </Box>
    </HStack>
  );
};

const AssignRole: FC = () => {
  const { hatId } = useParams();
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

  const { hat, isLoading } = useGetHat(hatId!);

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

  return (
    <>
      <Heading as="h2" fontSize="xl" mb={4}>
        Assign Role
      </Heading>

      <HatsListItemParser detailUri={hat?.details} imageUri={hat?.imageUri}>
        <RoleDetail />
      </HatsListItemParser>

      {/* User name or address input */}
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">
          ユーザー名 or ウォレットアドレス
        </Text>
        <CommonInput
          placeholder="ユーザー名 or ウォレットアドレス"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
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
        <CommonInput
          value=""
          onChange={() => {}}
          type="date"
          defaultValue={today}
        />
      </Box>

      {/* Assign Button */}
      <Button
        onClick={handleAssign}
        bg="#FFD266"
        color="black"
        w="100%"
        size="lg"
        // isLoading={isAssigning}
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
    </>
  );
};

export default AssignRole;
