import {
  Box,
  Flex,
  Float,
  HStack,
  List,
  Separator,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Hat, Wearer } from "@hatsprotocol/sdk-v1-subgraph";
import { useParams } from "@remix-run/react";
import { useNamesByAddresses } from "hooks/useENS";
import { useAssignableHats, useHats } from "hooks/useHats";
import { useSplitsCreator } from "hooks/useSplitsCreator";
import {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { HatsDetailSchama } from "types/hats";
import { ipfs2https, ipfs2httpsJson } from "utils/ipfs";
import { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { CommonDialog } from "~/components/common/CommonDialog";
import { CommonInput } from "~/components/common/CommonInput";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { RoleIcon } from "~/components/icon/RoleIcon";
import { UserIcon } from "~/components/icon/UserIcon";
import { PageHeader } from "~/components/PageHeader";
import { Checkbox } from "~/components/ui/checkbox";
import { Field } from "~/components/ui/field";
import {
  FieldArrayWithId,
  useFieldArray,
  UseFieldArrayUpdate,
  useForm,
} from "react-hook-form";

interface RoleItemProps {
  update: UseFieldArrayUpdate<FormData, "roles">;
  fieldIndex: number;
  detail?: HatsDetailSchama;
  imageUri?: string;
  field: FieldArrayWithId<FormData, "roles", "id">;
}

const RoleItem: FC<RoleItemProps> = ({
  detail,
  imageUri,
  update,
  fieldIndex,
  field,
}) => {
  const { getWearersInfo } = useHats();

  const [wearersAddress, setWearersAddress] = useState<Address[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const res = await getWearersInfo({ hatId: field.hatId });
      if (!res) return;
      setWearersAddress(res.map((w) => w.id));
    };
    fetch();
  }, [field.hatId, getWearersInfo]);

  const { names } = useNamesByAddresses(wearersAddress);

  const handleOnCheck = (address: Address) => {
    if (!address) return;
    const array = field.wearers.includes(address)
      ? field.wearers.filter((a) => a !== address)
      : [...field.wearers, address];
    update(fieldIndex, {
      ...field,
      wearers: array,
    });
  };

  const handleUpdateMultiplier = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    update(fieldIndex, {
      ...field,
      multiplier: value,
    });
  };

  return (
    <List.Item>
      <HStack gap={2}>
        <Checkbox
          colorPalette="blue"
          checked={field.active}
          onChange={() => {
            update(fieldIndex, {
              ...field,
              active: !field.active,
            });
          }}
        />
        <RoleIcon size="70px" roleImageUrl={imageUri} />
        <Box>
          <Text>{detail?.data.name}</Text>
          <Flex alignItems="center" gap={2} mt={2}>
            <Text fontSize="sm">分配係数</Text>
            <CommonInput
              type="number"
              value={field.multiplier}
              onChange={handleUpdateMultiplier}
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
              <Stack rowGap={5}>
                {names
                  .filter((name) => name.length > 0)
                  .map((name, index) => (
                    <HStack columnGap={3} key={index + name[0]?.address}>
                      <Checkbox
                        colorPalette="blue"
                        checked={field.wearers.includes(
                          name[0]?.address.toLowerCase() as Address
                        )}
                        onChange={() =>
                          handleOnCheck(
                            name[0]?.address.toLowerCase() as Address
                          )
                        }
                      />
                      <UserIcon
                        size="40px"
                        userImageUrl={ipfs2https(name[0]?.text_records?.avatar)}
                      />
                      <Box>
                        <Text>{name[0]?.name}</Text>
                        <Text>{name[0]?.address}</Text>
                      </Box>
                    </HStack>
                  ))}
              </Stack>

              {/* <Separator my={5} borderColor="black" />

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
              </List.Root> */}
            </Box>
          </CommonDialog>
        </Box>
      </HStack>
    </List.Item>
  );
};

interface FormData {
  roles: RoleInput[];
}

interface RoleInput {
  hat: Pick<Hat, "details" | "imageUri">;
  hatId: Address;
  active: boolean;
  multiplier: number;
  wearers: Address[];
}

const SplitterNew: FC = () => {
  const { treeId } = useParams();

  const hats = useAssignableHats(Number(treeId));

  const baseHats = useMemo(() => {
    return hats.filter(
      (h) => Number(h.levelAtLocalTree) == 2 && h.wearers?.length
    );
  }, [hats]);

  const { createSplits, previewSplits } = useSplitsCreator(treeId!);

  const { control, getValues } = useForm<FormData>();
  const { fields, insert, update } = useFieldArray({
    control,
    name: "roles",
  });

  useEffect(() => {
    const fetch = async () => {
      if (fields.length == 0) {
        for (let index = 0; index < baseHats.length; index++) {
          const hat = baseHats[index];
          insert(index, {
            hat,
            hatId: hat.id,
            active: true,
            multiplier: 1,
            wearers: hat.wearers?.map((w) => w.id) || [],
          });
        }
      }
    };
    fetch();
  }, [baseHats, fields]);

  const [preview, setPreview] =
    useState<{ address: Address; ratio: string }[]>();

  const handlePreview = async () => {
    const data = getValues();

    const params = data.roles.map((role) => ({
      hatId: BigInt(role.hatId),
      multiplierBottom: role.multiplier
        ? BigInt(String(role.multiplier).split(".")[1].length * 10)
        : BigInt(1),
      multiplierTop: role.multiplier
        ? BigInt(
            role.multiplier * String(role.multiplier).split(".")[1].length * 10
          )
        : BigInt(1),
      wearers: role.wearers,
    }));
    const res = await previewSplits(params);

    const _preview = [];
    const sumOfScore = res[1].reduce((acc, cur) => acc + Number(cur), 0);
    for (let index = 0; index < res[0].length; index++) {
      const address = res[0][index];
      const score = res[1][index];
      const ratio = ((Number(score) / sumOfScore) * 100).toFixed(2);
      _preview.push({ address, ratio });
    }
    setPreview(_preview);
  };

  const handleCreateSplitter = async () => {
    const data = getValues();
    const params = data.roles.map((role) => ({
      hatId: BigInt(role.hatId),
      multiplierBottom: role.multiplier
        ? BigInt(String(role.multiplier).split(".")[1].length * 10)
        : BigInt(1),
      multiplierTop: role.multiplier
        ? BigInt(
            role.multiplier * String(role.multiplier).split(".")[1].length * 10
          )
        : BigInt(1),
      wearers: role.wearers,
    }));
    const txHash = await createSplits({
      args: params,
    });
    console.log(txHash);
  };

  return (
    <>
      <PageHeader
        title="Create Splitter"
        backLink={
          preview
            ? () => {
                setPreview(undefined);
              }
            : undefined
        }
      />

      {preview ? (
        <>
          <List.Root>
            {preview.map((item, index) => (
              <List.Item key={index}>
                <HStack gap={2}>
                  <Text>{item.address}</Text>
                  <Text>{item.ratio}%</Text>
                </HStack>
              </List.Item>
            ))}
          </List.Root>
          <BasicButton onClick={handleCreateSplitter}>作成</BasicButton>
        </>
      ) : (
        <>
          <Field label="Splitter名" mt={5}>
            <CommonInput value="" onChange={() => {}} placeholder="名前" />
          </Field>

          <Text fontSize="lg" mt={10}>
            分配設定
          </Text>
          <List.Root listStyle="none" mb={10}>
            {fields.map((field, index) => (
              <HatsListItemParser
                key={index}
                detailUri={field.hat.details}
                imageUri={field.hat.imageUri}
              >
                <RoleItem update={update} fieldIndex={index} field={field} />
              </HatsListItemParser>
            ))}
          </List.Root>
          <BasicButton onClick={handlePreview}>プレビュー</BasicButton>
        </>
      )}
    </>
  );
};

export default SplitterNew;
