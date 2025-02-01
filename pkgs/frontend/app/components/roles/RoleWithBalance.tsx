import { HStack, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "@remix-run/react";
import type { FC } from "react";
import type { HatsDetailSchama } from "types/hats";
import CommonButton from "../common/CommonButton";
import { RoleIcon } from "../icon/RoleIcon";

interface RoleProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
  balance?: number;
  isHolder?: boolean;
  treeId?: string;
  hatId?: `0x${string}`;
  address?: `0x${string}`;
}

const RoleWithBalance: FC<RoleProps> = (params) => {
  const { detail, imageUri, balance, isHolder, treeId, hatId, address } =
    params;

  const navigate = useNavigate();

  return (
    <HStack width="full" gap={5}>
      <RoleIcon size={32} roleImageUrl={imageUri} />
      <VStack alignItems="start" width="full">
        <HStack width="full" justifyContent="space-between">
          <Text>{detail?.data.name}</Text>
          {isHolder && (
            <Text
              px={2}
              py={1}
              rounded="md"
              bgColor="yellow.400"
              textStyle="xs"
            >
              役割保持者
            </Text>
          )}
        </HStack>
        <Text textStyle="2xl">{balance}/10000</Text>
        <CommonButton
          onClick={() =>
            navigate(`/${treeId}/${hatId}/${address}/assistcredit/send`)
          }
        >
          アシストクレジットを送る
        </CommonButton>
      </VStack>
    </HStack>
  );
};

export default RoleWithBalance;
