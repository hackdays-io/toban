import { HStack, Image, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "@remix-run/react";
import { FC } from "react";
import { HatsDetailSchama } from "types/hats";
import { RoleIcon } from "../icon/RoleIcon";
import CommonButton from "../common/CommonButton";

interface MyRoleProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
  address?: `0x${string}`;
  treeId?: string;
  hatId?: `0x${string}`;
}

export const MyRole: FC<MyRoleProps> = (params) => {
  const { address, detail, imageUri, treeId, hatId } = params;

  const navigate = useNavigate();

  return (
    <HStack w="full" gap={5}>
      <RoleIcon size="130px" roleImageUrl={imageUri} />
      <VStack alignItems="start" width="full">
        <Text textStyle="xl">{detail?.data.name}</Text>
        <CommonButton
          onClick={() => navigate(`/${treeId}/${hatId}/${address}`)}
        >
          See Detail
        </CommonButton>
        <CommonButton
          onClick={() =>
            navigate(`/${treeId}/${hatId}/${address}/assistcredit/send`)
          }
        >
          Transfer Assist Credit
        </CommonButton>
      </VStack>
    </HStack>
  );
};
