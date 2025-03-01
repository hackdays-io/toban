import {
  Box,
  Flex,
  Float,
  Grid,
  HStack,
  List,
  Separator,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { Hat, Wearer } from "@hatsprotocol/sdk-v1-subgraph";
import {
  useAddressesByNames,
  useNamesByAddresses,
  useSetName,
} from "hooks/useENS";
import { useAssignableHats, useHats } from "hooks/useHats";
import { useSplitsCreator } from "hooks/useSplitsCreator";
import {
  type ChangeEvent,
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type FieldArrayWithId,
  type UseFieldArrayUpdate,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import type { HatsDetailSchama } from "types/hats";
import { ipfs2https, ipfs2httpsJson } from "utils/ipfs";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { PageHeader } from "~/components/PageHeader";
import { CommonDialog } from "~/components/common/CommonDialog";
import { CommonInput } from "~/components/common/CommonInput";
import { HatsListItemParser } from "~/components/common/HatsListItemParser";
import { RoleIcon } from "~/components/icon/RoleIcon";
import { UserIcon } from "~/components/icon/UserIcon";
import { SplitRecipientsList } from "~/components/splits/SplitRecipientsList";
import { Checkbox } from "~/components/ui/checkbox";
import { Field } from "~/components/ui/field";

interface RoleItemProps {
  update: UseFieldArrayUpdate<FormData, "roles">;
  fieldIndex: number;
  detail?: HatsDetailSchama;
  imageUri?: string;
  field: FieldArrayWithId<FormData, "roles", "id">;
  wearers: Wearer[];
}

const RoleItem: FC<RoleItemProps> = ({
  detail,
  imageUri,
  update,
  fieldIndex,
  field,
  wearers,
}) => {
  const addresses = useMemo(() => {
    return wearers.map((w) => w.id);
  }, [wearers]);
  const { names } = useNamesByAddresses(addresses);

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
    <List.Item mb={5}>
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
                  .map((name) => (
                    <HStack columnGap={3} key={name[0]?.address}>
                      <Checkbox
                        colorPalette="blue"
                        checked={field.wearers.includes(
                          name[0]?.address.toLowerCase() as Address,
                        )}
                        onChange={() =>
                          handleOnCheck(
                            name[0]?.address.toLowerCase() as Address,
                          )
                        }
                      />
                      <UserIcon
                        size="40px"
                        userImageUrl={ipfs2https(name[0]?.text_records?.avatar)}
                      />
                      <Box>
                        <Text wordBreak="break-all">{name[0]?.name}</Text>
                        <Text wordBreak="break-all">{name[0]?.address}</Text>
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
  const navigate = useNavigate();

  const { treeId } = useParams();

  const hats = useAssignableHats(Number(treeId));

  const baseHats = useMemo(() => {
    return hats.filter(
      (h) => Number(h.levelAtLocalTree) === 2 && h.wearers?.length,
    );
  }, [hats]);

  const [splitterName, setSplitterName] = useState<string>("");
  const _splitterName = useMemo(() => {
    return [`${splitterName}.split`];
  }, [splitterName]);
  const { addresses } = useAddressesByNames(_splitterName, true);
  const availableName = useMemo(() => {
    if (!splitterName) return false;

    return addresses?.[0]?.length === 0;
  }, [splitterName, addresses]);

  const { createSplits, previewSplits, isLoading } = useSplitsCreator(
    treeId ?? "",
  );

  const { control, getValues } = useForm<FormData>();
  const { fields, insert, update } = useFieldArray({
    control,
    name: "roles",
  });

  useEffect(() => {
    const fetch = async () => {
      if (fields.length === 0) {
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
  }, [baseHats, fields.length, insert]);

  const [preview, setPreview] =
    useState<{ address: Address; percentAllocation: number }[]>();

  const calcParams = useCallback(() => {
    const data = getValues();

    return data.roles
      .filter((r) => r.active)
      .map((role) => {
        const [multiplierTop, multiplierBottom] = role.multiplier
          ? String(role.multiplier).includes(".")
            ? [
                BigInt(
                  role.multiplier *
                    10 ** String(role.multiplier).split(".")[1].length,
                ),
                BigInt(10 ** String(role.multiplier).split(".")[1].length),
              ]
            : [BigInt(role.multiplier), BigInt(1)]
          : [BigInt(1), BigInt(1)];

        return {
          hatId: BigInt(role.hatId),
          multiplierTop,
          multiplierBottom,
          wearers: role.wearers,
        };
      });
  }, [getValues]);

  const handlePreview = useCallback(async () => {
    if (!availableName) return;
    const params = calcParams();
    const res = await previewSplits(params);

    const consolidatedRecipients = res[0].reduce((acc, address, index) => {
      const percentAllocation = Number(res[1][index]);
      acc.set(address, (acc.get(address) || 0) + percentAllocation);
      return acc;
    }, new Map<Address, number>());

    setPreview(
      Array.from(consolidatedRecipients.entries()).map(
        ([address, percentAllocation]) => ({
          address,
          percentAllocation,
        }),
      ),
    );
  }, [availableName, previewSplits, calcParams]);

  const { setName } = useSetName();
  const handleCreateSplitter = async () => {
    try {
      const params = calcParams();
      const res = await createSplits({
        args: params,
      });

      const address = res?.find((res) => res.eventName === "SplitsCreated")
        ?.args.split;
      if (address) {
        await setName({ name: `${splitterName}.split`, address: address });
      }

      navigate(`/${treeId}/splits`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Grid
      minH="calc(100vh - 100px)"
      gridTemplateRows={preview ? "auto auto 1fr auto" : "auto auto 1fr auto"}
    >
      <PageHeader
        title="スプリッターを作成"
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
          <Text my={5} fontWeight="bold">
            スプリッター名: {splitterName}
          </Text>
          <SplitRecipientsList recipients={preview} />
          <BasicButton
            mb={5}
            onClick={handleCreateSplitter}
            loading={isLoading}
          >
            作成
          </BasicButton>
        </>
      ) : (
        <>
          <Field label="スプリッター名" mt={5}>
            <CommonInput
              value={splitterName}
              onChange={(e) => {
                setSplitterName(e.target.value);
              }}
              placeholder="名前"
            />
            <Text textAlign="right" fontSize="xs" mt={1} w="100%">
              {availableName
                ? "この名前は利用可能です"
                : "この名前は利用できません"}
            </Text>
          </Field>

          <Box>
            <Text fontSize="lg" mt={10}>
              分配設定
            </Text>
            <List.Root listStyle="none" mb={10}>
              {fields.map((field, index) => (
                <HatsListItemParser
                  key={field.hatId}
                  detailUri={field.hat.details}
                  imageUri={field.hat.imageUri}
                >
                  <RoleItem
                    update={update}
                    fieldIndex={index}
                    field={field}
                    wearers={
                      baseHats.find((h) => h.id === field.hatId)?.wearers || []
                    }
                  />
                </HatsListItemParser>
              ))}
            </List.Root>
          </Box>
          <BasicButton onClick={handlePreview} mb={5} disabled={!availableName}>
            プレビュー
          </BasicButton>
        </>
      )}
    </Grid>
  );
};

export default SplitterNew;
