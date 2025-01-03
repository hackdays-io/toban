import { FC, useState, useEffect, useMemo, useCallback } from "react";
import { Box, Button, Text, HStack } from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { Address } from "viem";
import { useAddressesByNames } from "hooks/useENS";
import { isValidEthAddress, abbreviateAddress } from "utils/wallet";
import { useGetHat } from "hooks/useHats";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { HatsDetailSchama } from "types/hats";
import { RoleIcon } from "~/components/icon/RoleIcon";
import { CommonInput } from "~/components/common/CommonInput";
import { PageHeader } from "~/components/PageHeader";
import { FaCircleCheck } from "react-icons/fa6";
import { useMintHatFromTimeFrameModule } from "hooks/useHatsTimeFrameModule";
import CommonButton from "~/components/common/CommonButton";
import { useGetWorkspace } from "hooks/useWorkspace";

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
  const { hatId, treeId } = useParams();

  const [inputValue, setInputValue] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<Address>();
  const [startDatetime, setStartDatetime] = useState<string>("");

  const { data } = useGetWorkspace(treeId!);
  console.log(data);
  const { mintHat, isLoading: isMinting } = useMintHatFromTimeFrameModule(
    data?.workspace?.hatsTimeFrameModule as Address
  );

  const { hat, isLoading } = useGetHat(hatId!);

  // Name resolution
  const { addresses, fetchAddresses } = useAddressesByNames(undefined, true);

  useEffect(() => {
    setResolvedAddress(undefined);
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

  const handleAssign = useCallback(async () => {
    if (!hatId) return;
    let finalAddress: Address | null = null;

    if (isValidEthAddress(inputValue)) {
      finalAddress = inputValue as Address;
    } else if (resolvedAddress) {
      finalAddress = resolvedAddress;
    } else {
      alert("Please enter a valid Ethereum address or username.");
      return;
    }

    await mintHat(
      BigInt(hatId),
      finalAddress,
      startDatetime
        ? BigInt(new Date(startDatetime as any).getTime() / 1000)
        : BigInt(0)
    );
  }, [hatId, resolvedAddress, inputValue, mintHat]);

  return (
    <>
      <PageHeader title="役割を割り当てる" />

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
          <HStack mt={1} fontSize="sm" justifyContent="end" color="blue.300">
            <FaCircleCheck />
            <Text color="gray.500">{abbreviateAddress(resolvedAddress)}</Text>
          </HStack>
        )}
      </Box>

      {/* Date input */}
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">
          開始日
        </Text>
        <CommonInput
          value={startDatetime!}
          onChange={(e) => {
            setStartDatetime(e.target.value);
          }}
          type="datetime-local"
        />
      </Box>

      {/* Assign Button */}
      <CommonButton
        onClick={handleAssign}
        bg="#FFD266"
        color="black"
        w="100%"
        size="lg"
        loading={isMinting}
        _hover={{ bg: "#FFC94D" }}
      >
        Assign
      </CommonButton>
    </>
  );
};

export default AssignRole;
