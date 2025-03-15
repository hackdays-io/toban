import { Box, Text } from "@chakra-ui/react";
import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { useNavigate, useParams } from "@remix-run/react";
import { useGetHat, useHats } from "hooks/useHats";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type {
  HatsDetailSchama,
  HatsDetailsAttributes,
  HatsDetailsAuthorities,
  HatsDetailsResponsabilities,
} from "types/hats";
import { ipfs2https, ipfs2httpsJson } from "utils/ipfs";
import { BasicButton } from "~/components/BasicButton";
import { ContentContainer } from "~/components/ContentContainer";
import { RoleAttributesList } from "~/components/RoleAttributesList";
import { InputDescription } from "~/components/input/InputDescription";
import { InputImage } from "~/components/input/InputImage";
import { InputName } from "~/components/input/InputName";
import { AddRoleAttributeDialog } from "~/components/roleAttributeDialog/AddRoleAttributeDialog";

const SectionHeading: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text mt={7}>{children}</Text>
);

interface FormValues {
  name: string;
  description: string;
  responsibilities: NonNullable<HatsDetailsResponsabilities>;
  authorities: NonNullable<HatsDetailsAuthorities>;
  imageFile: File | null;
}

const EditRole: FC = () => {
  const { treeId, hatId } = useParams();
  const navigate = useNavigate();
  const { wallet } = useActiveWallet();
  const { hat } = useGetHat(hatId || "");
  const { changeHatDetails, changeHatImageURI } = useHats();
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { uploadImageFileToIpfs, imageFile } = useUploadImageFileToIpfs();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      responsibilities: [],
      authorities: [],
      imageFile: null,
    },
  });

  useEffect(() => {
    const setInitialValues = async () => {
      if (!hat) return;
      const detailsJson: HatsDetailSchama = hat.details
        ? await ipfs2httpsJson(hat.details)
        : undefined;

      if (detailsJson) {
        setValue("name", detailsJson.data.name);
        setValue("description", detailsJson.data.description || "");
        setValue("responsibilities", detailsJson.data.responsabilities || []);
        setValue("authorities", detailsJson.data.authorities || []);
      }
    };
    setInitialValues();
  }, [hat, setValue]);

  const [originalDetails, setOriginalDetails] = useState<HatsDetailSchama>();

  useEffect(() => {
    const loadDetails = async () => {
      if (!hat?.details) return;
      const detailsJson = await ipfs2httpsJson(hat.details);
      setOriginalDetails(detailsJson);
    };
    loadDetails();
  }, [hat?.details]);

  const isChangedDetails = useCallback(
    (currentDetails: FormValues) => {
      if (!originalDetails) return true;

      const areArraysEqual = (
        arr1: HatsDetailsAttributes,
        arr2: HatsDetailsAttributes,
      ) => {
        if (arr1.length !== arr2.length) return false;
        return JSON.stringify(arr1) === JSON.stringify(arr2);
      };

      return (
        currentDetails.name !== originalDetails.data.name ||
        currentDetails.description !==
          (originalDetails.data.description || "") ||
        !areArraysEqual(
          currentDetails.responsibilities,
          originalDetails.data.responsabilities || [],
        ) ||
        !areArraysEqual(
          currentDetails.authorities,
          originalDetails.data.authorities || [],
        )
      );
    },
    [originalDetails],
  );

  const onSubmit = async (formData: FormValues) => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!formData.name) {
      alert("役割の名前を入力してください。");
      return;
    }
    if (!hatId) return;

    try {
      const promises = [];

      // Handle details change
      if (isChangedDetails(formData)) {
        const resUploadHatsDetails = await uploadHatsDetailsToIpfs({
          name: formData.name,
          description: formData.description,
          responsabilities: formData.responsibilities,
          authorities: formData.authorities,
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
      if (imageFile) {
        const resUploadImage = await uploadImageFileToIpfs();
        if (!resUploadImage) throw new Error("Failed to upload image to ipfs");

        promises.push(
          changeHatImageURI({
            hatId: BigInt(hatId),
            newImageURI: resUploadImage.ipfsUri,
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
    <>
      <Box mt={5} w="100%">
        <Text fontSize="lg">ロールを編集</Text>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ContentContainer>
            <Controller
              name="imageFile"
              control={control}
              render={({ field: { onChange, value } }) => (
                <InputImage
                  imageFile={value}
                  setImageFile={onChange}
                  previousImageUrl={ipfs2https(hat?.imageUri)}
                />
              )}
            />
            <Controller
              name="name"
              control={control}
              render={({ field: { onChange, value } }) => (
                <InputName name={value} setName={onChange} />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field: { onChange, value } }) => (
                <InputDescription
                  description={value}
                  setDescription={onChange}
                  mt={6}
                />
              )}
            />
          </ContentContainer>

          <SectionHeading>Responsibilities</SectionHeading>
          <ContentContainer>
            <Controller
              name="responsibilities"
              control={control}
              render={({ field: { onChange, value } }) => (
                <>
                  <RoleAttributesList items={value} setItems={onChange} />
                  <AddRoleAttributeDialog
                    type="responsibility"
                    attributes={value}
                    setAttributes={onChange}
                  />
                </>
              )}
            />
          </ContentContainer>

          <SectionHeading>Authorities</SectionHeading>
          <ContentContainer>
            <Controller
              name="authorities"
              control={control}
              render={({ field: { onChange, value } }) => (
                <>
                  <RoleAttributesList items={value} setItems={onChange} />
                  <AddRoleAttributeDialog
                    type="authority"
                    attributes={value}
                    setAttributes={onChange}
                  />
                </>
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
              type="submit"
              disabled={!watch("name")}
              loading={isSubmitting}
            >
              保存
            </BasicButton>
          </Box>
        </form>
      </Box>
    </>
  );
};

export default EditRole;
