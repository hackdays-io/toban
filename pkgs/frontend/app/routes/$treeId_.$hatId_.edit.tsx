import { Box, Stack, Text } from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import { useGetHat, useHats } from "hooks/useHats";
import {
  useQueryIpfsJsonData,
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useCallback, useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import type {
  HatsDetailsAttributes,
  HatsDetailsAuthorities,
  HatsDetailsResponsabilities,
} from "types/hats";
import { ipfs2https } from "utils/ipfs";
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

const SectionHeading: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text mt={7}>{children}</Text>
);

interface FormData {
  name: string;
  description: string;
  image: File;
  selectedImageCid: string;
  responsibilities: HatsDetailsResponsabilities;
  authorities: HatsDetailsAuthorities;
  maxSupply: number | undefined;
}

const EditRole: FC = () => {
  const { treeId, hatId } = useParams();
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const { hat } = useGetHat(hatId || "");
  const { changeHatDetails, changeHatImageURI, changeHatMaxSupply } = useHats();
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { uploadImageFileToIpfs } = useUploadImageFileToIpfs();

  const { data: hatDetailJson } = useQueryIpfsJsonData(hat?.details);

  const { control, watch, handleSubmit, setValue, resetField, formState } =
    useForm<FormData>({
      defaultValues: {
        name: "",
        description: "",
        responsibilities: [],
        authorities: [],
        maxSupply: undefined,
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

  useEffect(() => {
    const setInitialValues = async () => {
      if (hatDetailJson) {
        setValue("name", hatDetailJson.data.name);
        setValue("description", hatDetailJson.data.description || "");
        setValue("responsibilities", hatDetailJson.data.responsabilities || []);
        setValue("authorities", hatDetailJson.data.authorities || []);
        setValue("maxSupply", Number(hat?.maxSupply) || undefined);
      }
    };
    setInitialValues();
  }, [hatDetailJson, hat?.maxSupply, setValue]);

  const isChangedDetails = useCallback(
    (currentDetails: FormData) => {
      if (!hatDetailJson) return true;

      const areArraysEqual = (
        arr1: HatsDetailsAttributes | undefined,
        arr2: HatsDetailsAttributes | undefined,
      ) => {
        if (!arr1 || !arr2) return arr1 === arr2;
        if (arr1.length !== arr2.length) return false;
        return JSON.stringify(arr1) === JSON.stringify(arr2);
      };

      return (
        currentDetails.name !== hatDetailJson.data.name ||
        currentDetails.description !== (hatDetailJson.data.description || "") ||
        !areArraysEqual(
          currentDetails.responsibilities,
          hatDetailJson.data.responsabilities || [],
        ) ||
        !areArraysEqual(
          currentDetails.authorities,
          hatDetailJson.data.authorities || [],
        ) ||
        currentDetails.image ||
        currentDetails.selectedImageCid ||
        currentDetails.maxSupply !== Number(hat?.maxSupply)
      );
    },
    [hatDetailJson, hat?.maxSupply],
  );

  const onSubmit = async (data: FormData) => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!data.name) {
      alert("当番の名前を入力してください。");
      return;
    }
    if (!hatId) return;

    try {
      const promises = [];

      // Handle details change
      if (isChangedDetails(data)) {
        const resUploadHatsDetails = await uploadHatsDetailsToIpfs({
          name: data.name,
          description: data.description,
          responsabilities: data.responsibilities,
          authorities: data.authorities,
        });
        if (!resUploadHatsDetails)
          throw new Error("Failed to upload metadata to ipfs");

        promises.push(
          changeHatDetails({
            hatId: BigInt(hatId),
            newDetails: resUploadHatsDetails.ipfsUri,
          }),
        );
      }

      // Handle image change
      if (data.image || data.selectedImageCid) {
        let imageUri = "";
        if (data.image) {
          const resUploadImage = await uploadImageFileToIpfs(data.image);
          if (!resUploadImage)
            throw new Error("Failed to upload image to ipfs");
          imageUri = resUploadImage.ipfsUri;
        } else if (data.selectedImageCid) {
          imageUri = `ipfs://${data.selectedImageCid}`;
        }

        if (imageUri) {
          promises.push(
            changeHatImageURI({
              hatId: BigInt(hatId),
              newImageURI: imageUri,
            }),
          );
        }
      }

      // Handle max supply change
      if (data.maxSupply && data.maxSupply !== Number(hat?.maxSupply)) {
        promises.push(
          changeHatMaxSupply({
            hatId: BigInt(hatId),
            newMaxSupply: data.maxSupply,
          }),
        );
      }

      await Promise.all(promises);
      navigate(`/${treeId}/${hatId}`);
    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました。${error}`);
    }
  };

  return (
    <Box w="100%" pb={10}>
      <PageHeader title="当番の編集" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <ContentContainer>
          <Stack my="30px" gap={3}>
            <Controller
              control={control}
              name="image"
              render={({ field: { onChange, value } }) => (
                <InputImage
                  imageFile={value}
                  setImageFile={onChange}
                  previousImageUrl={
                    watch("selectedImageCid")
                      ? ipfs2https(`ipfs://${watch("selectedImageCid")}`)
                      : ipfs2https(hat?.imageUri)
                  }
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

        <SectionHeading>当番の上限人数</SectionHeading>
        <ContentContainer>
          <Controller
            control={control}
            name="maxSupply"
            render={({ field: { onChange, value } }) => (
              <InputNumber
                mt={3}
                number={value}
                setNumber={onChange}
                defaultValue={hatDetailJson?.data.maxSupply}
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
            disabled={!watch("name")}
            loading={formState.isSubmitting}
            type="submit"
          >
            保存
          </BasicButton>
        </Box>
      </form>
    </Box>
  );
};

export default EditRole;
