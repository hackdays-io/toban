import { Box, Stack, Text } from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import { useHats } from "hooks/useHats";
import { useCreateHatFromHatCreatorModule } from "hooks/useHatsHatCreatorModule";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useCallback } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import type {
  HatsDetailsAttributes,
  HatsDetailsAuthorities,
  HatsDetailsResponsabilities,
} from "types/hats";
import { ipfs2https } from "utils/ipfs";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { ContentContainer } from "~/components/ContentContainer";
import { PageHeader } from "~/components/PageHeader";
import { RoleAttributesList } from "~/components/RoleAttributesList";
import { InputDescription } from "~/components/input/InputDescription";
import { InputImage } from "~/components/input/InputImage";
import { InputName } from "~/components/input/InputName";
import { InputNumber } from "~/components/input/InputNumber";
import { AddRoleAttributeDialog } from "~/components/roleAttributeDialog/AddRoleAttributeDialog";
import { RoleImageLibrarySelector } from "~/components/roles/RoleImageLibrarySelector";

interface FormData {
  name: string;
  description: string;
  image: File;
  selectedImageCid: string;
  responsibilities: HatsDetailsResponsabilities;
  authorities: HatsDetailsAuthorities;
  maxSupply: number | undefined;
}

const SectionHeading: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text mt={7}>{children}</Text>
);

const NewRole: FC = () => {
  const { treeId } = useParams();

  const { control, watch, handleSubmit, formState, resetField } =
    useForm<FormData>({
      defaultValues: {
        name: "",
        description: "",
        responsibilities: [],
        authorities: [],
        maxSupply: 10,
      },
    });

  const responsibilities = useFieldArray({
    name: "responsibilities",
    control,
  });

  const authorities = useFieldArray({
    name: "authorities",
    control,
  });

  const { wallet } = useActiveWallet();
  const { data: workspace } = useGetWorkspace(treeId);
  const { createHat } = useCreateHatFromHatCreatorModule(
    workspace?.workspace?.hatsHatCreatorModule?.id as Address,
  );
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { uploadImageFileToIpfs } = useUploadImageFileToIpfs();
  const { getTreeInfo } = useHats();
  const navigate = useNavigate();

  const submit = useCallback(
    async (data: FormData) => {
      if (!wallet) {
        alert("ウォレットを接続してください。");
        return;
      }
      if (!data.name) {
        alert("ロール名を入力してください。");
        return;
      }

      // const maxSupplyValue = Number(data.maxSupply);
      // if (Number.isNaN(maxSupplyValue) || maxSupplyValue <= 0) {
      //   alert("ロールの上限人数は正の整数である必要があります。");
      //   return;
      // }

      try {
        const [resUploadHatsDetails, resUploadImage, treeInfo] =
          await Promise.all([
            uploadHatsDetailsToIpfs({
              name: data.name,
              description: data.description,
              responsabilities: data.responsibilities,
              authorities: data.authorities,
            }),
            uploadImageFileToIpfs(data.image),
            getTreeInfo({ treeId: Number(treeId) }),
          ]);

        if (!resUploadHatsDetails)
          throw new Error("Failed to upload metadata to ipfs");

        const hatterHatId = treeInfo?.hats?.[1]?.id;
        if (!hatterHatId) throw new Error("Hat ID is required");

        const parsedLog = await createHat({
          parentHatId: BigInt(hatterHatId),
          details: resUploadHatsDetails?.ipfsUri,
          maxSupply: Number(data.maxSupply),
          imageURI:
            resUploadImage?.ipfsUri ||
            (data.selectedImageCid && `ipfs://${data.selectedImageCid}`) ||
            "",
        });

        const log = parsedLog?.find((log) => log.eventName === "HatCreated");

        if (!log) throw new Error("Failed to create hat transaction");

        await new Promise((resolve) => setTimeout(resolve, 3000));
        const hatIdLength = log.args.id?.toString(16).length || 0;
        const requiredPadding = 64 - hatIdLength;
        navigate(
          `/${treeId}/0x${"0".repeat(
            requiredPadding,
          )}${log.args.id?.toString(16)}`,
        );
      } catch (error) {
        console.error(error);
        alert(`エラーが発生しました。${error}`);
      }
    },
    [
      createHat,
      getTreeInfo,
      navigate,
      treeId,
      uploadHatsDetailsToIpfs,
      uploadImageFileToIpfs,
      wallet,
    ],
  );

  return (
    <Box w="100%" pb={10}>
      <PageHeader title="新しいロールを作成" />
      <form onSubmit={handleSubmit(submit)}>
        <ContentContainer>
          <Stack my="30px" gap={3}>
            <Controller
              control={control}
              name="image"
              render={({ field: { onChange, value } }) => (
                <InputImage
                  imageFile={
                    value || ipfs2https(`ipfs://${watch("selectedImageCid")}`)
                  }
                  setImageFile={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="selectedImageCid"
              render={({ field: { onChange, value } }) => (
                <RoleImageLibrarySelector
                  setImageCid={(cid) => {
                    resetField("image");
                    onChange(cid);
                  }}
                  selectedCid={value}
                />
              )}
            />
          </Stack>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <InputName name={value} setName={onChange} />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <InputDescription
                description={value}
                setDescription={onChange}
                mt={6}
              />
            )}
          />
        </ContentContainer>

        <SectionHeading>当番</SectionHeading>
        <ContentContainer>
          <RoleAttributesList
            items={responsibilities.fields}
            setItem={(index: number, value: HatsDetailsAttributes[number]) => {
              responsibilities.update(index, value);
            }}
            deleteItem={(index: number) => {
              responsibilities.remove(index);
            }}
          />
          <AddRoleAttributeDialog
            type="responsibility"
            attributes={responsibilities.fields}
            setAttributes={responsibilities.append}
          />
        </ContentContainer>

        <SectionHeading>権限</SectionHeading>
        <ContentContainer>
          <RoleAttributesList
            items={authorities.fields}
            setItem={(index: number, value: HatsDetailsAttributes[number]) => {
              authorities.update(index, value);
            }}
            deleteItem={(index: number) => {
              authorities.remove(index);
            }}
          />
          <AddRoleAttributeDialog
            type="authority"
            attributes={authorities.fields}
            setAttributes={authorities.append}
          />
        </ContentContainer>

        <SectionHeading>ロールの上限人数</SectionHeading>
        <ContentContainer>
          <Controller
            control={control}
            name="maxSupply"
            render={({ field: { onChange, value } }) => (
              <InputNumber
                mt={3}
                number={value}
                setNumber={onChange}
                placeholder="10"
              />
            )}
          />
        </ContentContainer>

        <Box
          mt={10}
          mb="4vh"
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <BasicButton
            disabled={!watch("name") || !watch("maxSupply")}
            loading={formState.isSubmitting}
            type="submit"
          >
            作成
          </BasicButton>
        </Box>
      </form>
    </Box>
  );
};

export default NewRole;
