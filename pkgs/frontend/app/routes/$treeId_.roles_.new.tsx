import { FC, useState } from "react";
import { useNavigate, useParams } from "@remix-run/react";
import { Box, Text } from "@chakra-ui/react";
import { InputImage } from "~/components/InputImage";
import {
  useUploadImageFileToIpfs,
  useUploadHatsDetailsToIpfs,
} from "hooks/useIpfs";
import { ContentContainer } from "~/components/ContentContainer";
import { InputName } from "~/components/InputName";
import { InputDescription } from "~/components/InputDescription";
import { BasicButton } from "~/components/BasicButton";
import { useActiveWallet } from "hooks/useWallet";
import { useHats } from "hooks/useHats";
import {
  HatsDetailsAttributes,
  HatsDetailsAuthorities,
  HatsDetailsResponsabilities,
} from "types/hats";
import { AddRoleAttributeDialog } from "~/components/roleAttributeDialog/AddRoleAttributeDialog";
import { EditRoleAttributeDialog } from "~/components/roleAttributeDialog/EditRoleAttributeDialog";

const SectionHeading: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text mt={7}>{children}</Text>
);

const DynamicInputList: FC<{
  items: HatsDetailsAttributes;
  setItems: (value: HatsDetailsAttributes) => void;
}> = ({ items, setItems }) => {
  return (
    <Box w="100%" mt={2}>
      {items.map((_, index) => (
        <Box
          key={index}
          minHeight="45px"
          mt={2}
          width="100%"
          border="1px solid"
          borderColor="gray.800"
          borderRadius="xl"
          backgroundColor="white"
          py="auto"
          display="flex"
          alignItems="stretch"
          justifyContent="space-between"
          gap={4}
          fontWeight="normal"
        >
          <Text ml={4} display="flex" alignItems="center">
            {items[index]?.label}
          </Text>
          <Box ml="auto" display="flex" alignItems="center">
            <EditRoleAttributeDialog
              type="responsibility"
              attributes={items}
              setAttributes={setItems}
              attributeIndex={index}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const NewRole: FC = () => {
  const { treeId } = useParams();

  const { uploadImageFileToIpfs, imageFile, setImageFile } =
    useUploadImageFileToIpfs();

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const [responsibilities, setResponsibilities] = useState<
    NonNullable<HatsDetailsResponsabilities>
  >([]);
  // const [responsibilitiesCount, setResponsibilitiesCount] = useState<number>(0);

  const [authorities, setAuthorities] = useState<
    NonNullable<HatsDetailsAuthorities>
  >([]);
  // const [authoritiesCount, setAuthoritiesCount] = useState<number>(0);
  const { wallet } = useActiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const { createHat } = useHats();
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { getTreeInfo } = useHats();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!roleName || !roleDescription || !imageFile) {
      alert("全ての項目を入力してください。");
      return;
    }

    try {
      setIsLoading(true);

      const [resUploadHatsDetails, resUploadImage, treeInfo] =
        await Promise.all([
          uploadHatsDetailsToIpfs({
            name: roleName,
            description: roleDescription,
            responsabilities: [],
            authorities: [],
          }),
          uploadImageFileToIpfs(),
          getTreeInfo({ treeId: Number(treeId) }),
        ]);

      if (!resUploadHatsDetails)
        throw new Error("Failed to upload metadata to ipfs");
      if (!resUploadImage) throw new Error("Failed to upload image to ipfs");

      // @todo HatterHatが親でよいか？
      const hatterHatId = treeInfo?.hats?.[1]?.id;
      if (!hatterHatId) throw new Error("Hat ID is required");

      console.log("resUploadHatsDetails", resUploadHatsDetails);
      console.log("resUploadImage", resUploadImage);
      console.log("hatterHatId", hatterHatId);

      const parsedLog = await createHat({
        parentHatId: BigInt(hatterHatId),
        details: resUploadHatsDetails?.ipfsUri,
        imageURI: resUploadImage?.ipfsUri,
      });
      if (!parsedLog) throw new Error("Failed to create hat transaction");
      console.log("parsedLog", parsedLog);

      // @todo ハット作成後の遷移先はツリーのロール一覧ページでよいか？
      navigate(`/${treeId}/roles`);
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました。" + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Box mt={5} w="100%">
        <Text fontSize="lg">新しいロールを作成</Text>
        <ContentContainer>
          <InputImage imageFile={imageFile} setImageFile={setImageFile} />
          <InputName name={roleName} setName={setRoleName} />
          <InputDescription
            description={roleDescription}
            setDescription={setRoleDescription}
            mt={6}
          />
        </ContentContainer>
        <SectionHeading>Responsibilities</SectionHeading>
        <ContentContainer>
          <DynamicInputList
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
          <DynamicInputList items={authorities} setItems={setAuthorities} />
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
              !imageFile ||
              responsibilities.length === 0 ||
              authorities.length === 0
            }
            loading={isLoading}
          >
            作成
          </BasicButton>
        </Box>
      </Box>
    </>
  );
};

export default NewRole;
