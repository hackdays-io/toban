import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { useNamesByAddresses } from "hooks/useENS";
import { type FC, useMemo } from "react";
import { useNavigate } from "react-router";
import type { HatsDetailSchama } from "types/hats";
import CommonButton from "../common/CommonButton";
import { RoleIcon } from "../icon/RoleIcon";
import { UserIcon } from "../icon/UserIcon";

interface RoleProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
  balance?: number;
  treeId?: string;
  hatId?: `0x${string}`;
  wearer?: `0x${string}`;
  address?: `0x${string}`;
  showSendButton?: boolean;
}

const RoleWithBalance: FC<RoleProps> = (params) => {
  const {
    detail,
    imageUri,
    balance,
    treeId,
    hatId,
    address,
    showSendButton,
    wearer,
  } = params;

  const navigate = useNavigate();

  const wearers = useMemo(() => {
    if (!wearer) return [];
    return [wearer];
  }, [wearer]);
  const { names } = useNamesByAddresses(wearers);

  const wearerIconUri = useMemo(() => {
    return names?.[0]?.[0].text_records?.avatar;
  }, [names]);

  return (
    <HStack width="full" gap={5}>
      <Box position="relative">
        <RoleIcon size={"60px"} roleImageUrl={imageUri} />
        <Box position="absolute" left={-2} bottom={-2}>
          <UserIcon size={"25px"} userImageUrl={wearerIconUri} />
        </Box>
      </Box>
      <VStack alignItems="start" width="full">
        <HStack width="full" justifyContent="space-between">
          <Text>{detail?.data.name}</Text>
        </HStack>
        <Flex justifyContent="space-between" w="full">
          <Text textStyle="2xl">
            {balance?.toLocaleString()}
            {" / "}
            <Box fontSize="md" as="span">
              10,000
            </Box>
          </Text>
          {showSendButton && (
            <CommonButton
              w="auto"
              size="sm"
              onClick={() =>
                navigate(`/${treeId}/${hatId}/${address}/assistcredit/send`)
              }
            >
              送る
            </CommonButton>
          )}
        </Flex>
      </VStack>
    </HStack>
  );
};

export default RoleWithBalance;
