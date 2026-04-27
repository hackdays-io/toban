import { Box, Grid, HStack, List, Text, VStack } from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import { useAddressesByNames } from "hooks/useENS";
import { useGetHat } from "hooks/useHats";
import { useMintHatFromTimeFrameModule } from "hooks/useHatsTimeFrameModule";
import { useGetWorkspace } from "hooks/useWorkspace";
import type { NameData } from "namestone-sdk";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { FaCircleCheck } from "react-icons/fa6";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https } from "utils/ipfs";
import { abbreviateAddress, isValidEthAddress } from "utils/wallet";
import type { Address } from "viem";
import { PageHeader } from "~/components/PageHeader";
import CommonButton from "~/components/common/CommonButton";
import { CommonInput } from "~/components/common/CommonInput";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { RoleIcon } from "~/components/icon/RoleIcon";
import { UserIcon } from "~/components/icon/UserIcon";

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

const SUGGESTION_LIMIT = 3;

const AssignRole: FC = () => {
  const { hatId, treeId } = useParams();

  const [inputValue, setInputValue] = useState("");
  const [pickedAddress, setPickedAddress] = useState<Address>();
  const [startDatetime, setStartDatetime] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data } = useGetWorkspace({ workspaceId: treeId || "" });
  const { mintHat, isLoading: isMinting } = useMintHatFromTimeFrameModule(
    data?.workspace?.hatsTimeFrameModule as Address,
  );

  const { hat } = useGetHat(hatId ?? "");

  const navigate = useNavigate();

  const trimmedInput = inputValue.trim();
  const isInputAddress = isValidEthAddress(trimmedInput);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(trimmedInput);
    }, 250);
    return () => clearTimeout(handle);
  }, [trimmedInput]);

  const searchTerms = useMemo(() => {
    if (!debouncedQuery) return undefined;
    if (isValidEthAddress(debouncedQuery)) return undefined;
    if (debouncedQuery.startsWith("0x")) return undefined;
    return [debouncedQuery];
  }, [debouncedQuery]);

  const { addresses, isLoading: isSearching } = useAddressesByNames(
    searchTerms,
    false,
  );

  const suggestions = useMemo<NameData[]>(() => {
    if (!searchTerms || !addresses?.length) return [];
    return (addresses[0] ?? [])
      .filter((entry) => entry.name && entry.address)
      .slice(0, SUGGESTION_LIMIT);
  }, [addresses, searchTerms]);

  const resolvedAddress = useMemo<Address | undefined>(() => {
    if (isInputAddress) return trimmedInput as Address;
    if (pickedAddress) return pickedAddress;
    const exact = suggestions.find(
      (s) => s.name.toLowerCase() === trimmedInput.toLowerCase(),
    );
    return exact ? (exact.address as Address) : undefined;
  }, [isInputAddress, trimmedInput, pickedAddress, suggestions]);

  const showSuggestions =
    !isInputAddress && trimmedInput.length > 0 && suggestions.length > 0;

  const handleSelectSuggestion = useCallback((user: NameData) => {
    setInputValue(user.name);
    setPickedAddress(user.address as Address);
  }, []);

  const handleAssign = useCallback(async () => {
    if (!hatId) return;
    if (!resolvedAddress) {
      alert("Please enter a valid Ethereum address or username.");
      return;
    }

    await mintHat(
      BigInt(hatId),
      resolvedAddress,
      startDatetime
        ? BigInt(new Date(startDatetime).getTime() / 1000)
        : BigInt(0),
    );

    navigate(`/${treeId}/${hatId}`);
  }, [treeId, hatId, resolvedAddress, startDatetime, navigate, mintHat]);

  return (
    <Grid gridTemplateRows="1fr auto" minH="calc(100vh - 100px)" pb={5}>
      <Box>
        <Box mb={5}>
          <PageHeader title="当番を割り当てる" />
        </Box>
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
            onChange={(e) => {
              setInputValue(e.target.value);
              setPickedAddress(undefined);
            }}
          />

          {showSuggestions && (
            <List.Root listStyle="none" mt={2} gap={1}>
              {suggestions.map((user) => {
                const isPicked =
                  pickedAddress?.toLowerCase() === user.address.toLowerCase();
                return (
                  <List.Item
                    key={user.address}
                    onClick={() => handleSelectSuggestion(user)}
                    cursor="pointer"
                    p={2}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={isPicked ? "blue.300" : "gray.200"}
                    bg={isPicked ? "blue.50" : "white"}
                    _hover={{ bg: "gray.50" }}
                  >
                    <HStack>
                      <UserIcon
                        userImageUrl={ipfs2https(user.text_records?.avatar)}
                        size={8}
                      />
                      <VStack align="start" gap={0} flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {user.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {abbreviateAddress(user.address)}
                        </Text>
                      </VStack>
                    </HStack>
                  </List.Item>
                );
              })}
            </List.Root>
          )}

          {!isInputAddress &&
            trimmedInput.length > 0 &&
            !isSearching &&
            suggestions.length === 0 && (
              <Text mt={1} fontSize="sm" color="gray.500">
                該当するユーザーが見つかりませんでした
              </Text>
            )}

          {resolvedAddress && !isInputAddress && (
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
            value={startDatetime || ""}
            onChange={(e) => {
              setStartDatetime(e.target.value);
            }}
            type="datetime-local"
          />
        </Box>
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
    </Grid>
  );
};

export default AssignRole;
