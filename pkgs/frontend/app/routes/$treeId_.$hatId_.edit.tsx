import { Box, Text } from "@chakra-ui/react";
import type { Hat } from "@hatsprotocol/sdk-v1-subgraph";
import { useHats } from "hooks/useHats";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { type FC, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const EditRole: FC = () => {
  const { treeId, hatId } = useParams();

  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const [responsibilities, setResponsibilities] = useState<
    NonNullable<HatsDetailsResponsabilities>
  >([]);

  const [authorities, setAuthorities] = useState<
    NonNullable<HatsDetailsAuthorities>
  >([]);
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const { changeHatDetails, changeHatImageURI } = useHats();
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const navigate = useNavigate();
  const { getHat } = useHats();
  const [hat, setHat] = useState<Hat | undefined>(undefined);
  const [details, setDetails] = useState<HatsDetailSchama | undefined>(
    undefined,
  );

  useEffect(() => {
    const fetchHat = async () => {
      if (!hatId) return;
      const resHat = await getHat(hatId);
      console.log("hat", resHat);
      if (resHat && resHat !== hat) {
        setHat(resHat);
      }
    };
    fetchHat();
  }, [hatId, getHat, hat]);

  useEffect(() => {
    const setStates = async () => {
      if (!hat) return;
      const detailsJson: HatsDetailSchama = hat.details
        ? await ipfs2httpsJson(hat.details)
        : undefined;
      console.log("detailsJson", detailsJson);
      setDetails(detailsJson);
      setRoleName(detailsJson?.data.name ?? "");
      setRoleDescription(detailsJson?.data.description ?? "");
      setResponsibilities(detailsJson?.data.responsabilities ?? []);
      setAuthorities(detailsJson?.data.authorities ?? []);
    };
    setStates();
  }, [hat]);

  const areArraysEqual = (
    arr1: HatsDetailsAttributes,
    arr2: HatsDetailsAttributes,
  ) => {
    if (arr1.length !== arr2.length) return false;
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  };

  const isChangedDetails = () => {
    if (!details) return false;

    return (
      details.data.name !== roleName ||
      details.data.description !== roleDescription ||
      !areArraysEqual(details.data.responsabilities ?? [], responsibilities) ||
      !areArraysEqual(details.data.authorities ?? [], authorities)
    );
  };

  const changeDetails = async () => {
    if (!hatId) return;

    const isChanged = isChangedDetails();
    if (!isChanged) return;

    const resUploadHatsDetails = await uploadHatsDetailsToIpfs({
      name: roleName,
      description: roleDescription,
      responsabilities: responsibilities,
      authorities: authorities,
    });
    if (!resUploadHatsDetails)
      throw new Error("Failed to upload metadata to ipfs");
    const ipfsUri = resUploadHatsDetails.ipfsUri;
    const parsedLog = await changeHatDetails({
      hatId: BigInt(hatId),
      newDetails: ipfsUri,
    });
    if (!parsedLog) throw new Error("Failed to change hat details");
    console.log("parsedLog", parsedLog);
  };

  const changeImage = async () => {
    if (!hatId || !hat || !imageFile) return;
    const resUploadImage = await uploadImageFileToIpfs();
    if (!resUploadImage) throw new Error("Failed to upload image to ipfs");
    const ipfsUri = resUploadImage.ipfsUri;
    const parsedLog = await changeHatImageURI({
      hatId: BigInt(hatId),
      newImageURI: ipfsUri,
    });
    if (!parsedLog) throw new Error("Failed to change hat image");
    console.log("parsedLog", parsedLog);
  };

  const handleSubmit = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!roleName || !roleDescription) {
      alert("全ての項目を入力してください。");
      return;
    }

    try {
      setIsLoading(true);

      await Promise.all([changeDetails(), changeImage()]);

      navigate(`/${treeId}/roles`);
    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました。${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Box mt={5} w="100%">
        <Text fontSize="lg">ロールを編集</Text>
        <ContentContainer>
          <InputImage
            imageFile={imageFile}
            setImageFile={setImageFile}
            previousImageUrl={ipfs2https(hat?.imageUri)}
          />
          <InputName name={roleName} setName={setRoleName} />
          <InputDescription
            description={roleDescription}
            setDescription={setRoleDescription}
            mt={6}
          />
        </ContentContainer>
        <SectionHeading>Responsibilities</SectionHeading>
        <ContentContainer>
          <RoleAttributesList
            items={responsibilities}
            setItems={setResponsibilities}
          />
          <AddRoleAttributeDialog
            type="responsibility"
            attributes={responsibilities}
            setAttributes={setResponsibilities}
          />
        </ContentContainer>
        <SectionHeading>Authorities</SectionHeading>
        <ContentContainer>
          <RoleAttributesList items={authorities} setItems={setAuthorities} />
          <AddRoleAttributeDialog
            type="authority"
            attributes={authorities}
            setAttributes={setAuthorities}
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
            onClick={handleSubmit}
            disabled={
              !roleName ||
              !roleDescription ||
              responsibilities.length === 0 ||
              authorities.length === 0 ||
              (!isChangedDetails() && !imageFile)
            }
            loading={isLoading}
          >
            保存
          </BasicButton>
        </Box>
      </Box>
    </>
  );
};

export default EditRole;
