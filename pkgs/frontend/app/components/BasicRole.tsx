import { HStack, Image, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "@remix-run/react";
import { FC } from "react";
import { HatsDetailSchama } from "types/hats";
import { BasicButton } from "./BasicButton";

interface BasicRoleProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
}

export const VerticalRole: FC<BasicRoleProps> = (params?) => {
  const { detail, imageUri } = params!;

  return (
    <VStack>
      <Image rounded="4xl" src={imageUri} />
      <Text>{detail?.data?.name}</Text>
    </VStack>
  );
};

export const HorizontalRole: FC<BasicRoleProps> = (params?) => {
  const { detail, imageUri } = params!;

  return (
    <HStack rounded="md" backgroundColor="yellow.400" gap={1} px={1}>
      <Image boxSize={6} rounded="4xl" src={imageUri} />
      <Text>{detail?.data?.name}</Text>
    </HStack>
  );
};

interface RoleActionsProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
  address?: `0x${string}`;
  treeId?: string;
  hatId?: `0x${string}`;
}

export const RoleActions: FC<RoleActionsProps> = (params) => {
  const { address, detail, imageUri, treeId, hatId } = params;

  const navigate = useNavigate();

  const navigateToDetail = () => navigate(`/${treeId}/${hatId}/${address}`);

  const navigateToAssistCredit = () =>
    navigate(`/${treeId}/${hatId}/${address}/assistcredit/send`);

  return (
    <HStack>
      <Image rounded="4xl" width="1/3" src={imageUri} />
      <VStack width="full">
        <Text textStyle="xl">{detail?.data.name}</Text>
        <BasicButton onClick={navigateToDetail}>See Detail</BasicButton>
        <BasicButton onClick={navigateToAssistCredit}>
          Transfer Assist Credit
        </BasicButton>
      </VStack>
    </HStack>
  );
};
