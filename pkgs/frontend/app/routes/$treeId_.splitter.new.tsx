import {
  Box,
  Flex,
  Float,
  HStack,
  List,
  Separator,
  Text,
} from "@chakra-ui/react";
import { useParams } from "@remix-run/react";
import { useAssignableHats } from "hooks/useHats";
import { FC } from "react";
import { HatsDetailSchama } from "types/hats";
import { BasicButton } from "~/components/BasicButton";
import { CommonDialog } from "~/components/common/CommonDialog";
import { CommonInput } from "~/components/common/CommonInput";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { RoleIcon } from "~/components/icon/RoleIcon";
import { UserIcon } from "~/components/icon/UserIcon";
import { PageHeader } from "~/components/PageHeader";
import { Checkbox } from "~/components/ui/checkbox";
import { Field } from "~/components/ui/field";

interface RoleItemProps {
  detail?: HatsDetailSchama;
  imageUri?: string;
}

const RoleItem: FC<RoleItemProps> = ({ detail, imageUri }) => {
  return (
    <List.Item>
      <HStack gap={2}>
        <Checkbox />
        <RoleIcon size="70px" roleImageUrl={imageUri} />
        <Box>
          <Text>{detail?.data.name}</Text>
          <Flex alignItems="center" gap={2} mt={2}>
            <Text fontSize="sm">分配係数</Text>
            <CommonInput
              type="number"
              value={1}
              onChange={() => {}}
              placeholder="例: 1, 1.5 10"
              textAlign="center"
              w="80px"
            />
            <Text as="span">倍</Text>
          </Flex>
          <CommonDialog
            dialogTriggerReactNode={
              <Text cursor="pointer" fontSize="sm" mt={2} textAlign="right">
                詳細設定 ▶
              </Text>
            }
          >
            <Box p={5}>
              <Text fontSize="lg" mb={5}>
                分配対象にするメンバーと役割を選択
              </Text>
              <HStack gap={2}>
                <Checkbox />
                <UserIcon size="40px" />
                <Box>
                  <Text>User name</Text>
                  <Text>0x123</Text>
                </Box>
              </HStack>

              <Separator my={5} borderColor="black" />

              <List.Root listStyle="none" mb={10}>
                <List.Item>
                  <HStack gap={2}>
                    <Checkbox checked="indeterminate" />
                    <RoleIcon size="50px" />
                    <Box>
                      <Text>Role Name</Text>
                    </Box>
                  </HStack>
                  <List.Root listStyle="none" pl={10} mt={3}>
                    <List.Item>
                      <HStack gap={2}>
                        <Checkbox />
                        <UserIcon size="30px" />
                        <Box>
                          <Text>User name</Text>
                          <Text>0x123</Text>
                        </Box>
                      </HStack>
                    </List.Item>
                  </List.Root>
                </List.Item>
              </List.Root>
            </Box>
          </CommonDialog>
        </Box>
      </HStack>
    </List.Item>
  );
};

const SplitterNew: FC = () => {
  const { treeId } = useParams();

  const hats = useAssignableHats(Number(treeId));

  const baseHats = hats.filter((h) => Number(h.levelAtLocalTree) == 2);

  return (
    <>
      <PageHeader title="Create Splitter" />

      <Field label="Splitter名" mt={5}>
        <CommonInput value="" onChange={() => {}} placeholder="名前" />
      </Field>

      <Text fontSize="lg" mt={10}>
        分配設定
      </Text>
      <List.Root listStyle="none" mb={10}>
        {baseHats.map((h, index) => (
          <HatsListItemParser
            key={index}
            detailUri={h.details}
            imageUri={h.imageUri}
          >
            <RoleItem />
          </HatsListItemParser>
        ))}
      </List.Root>
      <BasicButton>プレビュー</BasicButton>
    </>
  );
};

export default SplitterNew;
