import { Box, Text } from "@chakra-ui/react";
import { useNavigate, useParams } from "@remix-run/react";
import { useHats } from "hooks/useHats";
import { useCreateHatFromHatCreatorModule } from "hooks/useHatsHatCreatorModule";
import {
  useUploadHatsDetailsToIpfs,
  useUploadImageFileToIpfs,
} from "hooks/useIpfs";
import { useActiveWallet } from "hooks/useWallet";
import { useGetWorkspace } from "hooks/useWorkspace";
import { type FC, useCallback, useState } from "react";
import type {
  HatsDetailsAuthorities,
  HatsDetailsResponsabilities,
} from "types/hats";
import type { Address } from "viem";
import { BasicButton } from "~/components/BasicButton";
import { ContentContainer } from "~/components/ContentContainer";
import { PageHeader } from "~/components/PageHeader";
import { RoleAttributesList } from "~/components/RoleAttributesList";
import { InputDescription } from "~/components/input/InputDescription";
import { InputImage } from "~/components/input/InputImage";
import { InputName } from "~/components/input/InputName";
import { AddRoleAttributeDialog } from "~/components/roleAttributeDialog/AddRoleAttributeDialog";

const SectionHeading: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text mt={7}>{children}</Text>
);

const NewRole: FC = () => {
  const { treeId } = useParams();

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
  const { data: workspace } = useGetWorkspace(treeId);
  const { createHat, isLoading: isCreating } = useCreateHatFromHatCreatorModule(
    workspace?.workspace?.hatsHatCreatorModule?.id as Address,
  );
  const { uploadHatsDetailsToIpfs } = useUploadHatsDetailsToIpfs();
  const { getTreeInfo } = useHats();
  const navigate = useNavigate();

  const handleSubmit = useCallback(async () => {
    if (!wallet) {
      alert("ウォレットを接続してください。");
      return;
    }
    if (!roleName) {
      alert("ロール名を入力してください。");
      return;
    }

    try {
      setIsLoading(true);

      const [resUploadHatsDetails, resUploadImage, treeInfo] =
        await Promise.all([
          uploadHatsDetailsToIpfs({
            name: roleName,
            description: roleDescription,
            responsabilities: responsibilities,
            authorities: authorities,
          }),
          uploadImageFileToIpfs(),
          getTreeInfo({ treeId: Number(treeId) }),
        ]);

      if (!resUploadHatsDetails)
        throw new Error("Failed to upload metadata to ipfs");

      const hatterHatId = treeInfo?.hats?.[1]?.id;
      if (!hatterHatId) throw new Error("Hat ID is required");

      const parsedLog = await createHat({
        parentHatId: BigInt(hatterHatId),
        details: resUploadHatsDetails?.ipfsUri,
        imageURI: resUploadImage?.ipfsUri || "",
      });
      const log = parsedLog?.find((log) => log.eventName === "HatCreated");
      if (!log) throw new Error("Failed to create hat transaction");
      setTimeout(() => {
        const hatIdLength = log.args.id?.toString(16).length || 0;
        const requiredPadding = 64 - hatIdLength;
        navigate(
          `/${treeId}/0x${"0".repeat(
            requiredPadding,
          )}${log.args.id?.toString(16)}`,
        );
      }, 3000);
    } catch (error) {
      console.error(error);
      alert(`エラーが発生しました。${error}`);
      setIsLoading(false);
    }
  }, [
    authorities,
    createHat,
    navigate,
    responsibilities,
    roleName,
    roleDescription,
    treeId,
    uploadHatsDetailsToIpfs,
    uploadImageFileToIpfs,
    wallet,
    getTreeInfo,
  ]);

  return (
    <>
      <Box w="100%">
        <PageHeader title="新しいロールを作成" />
        <ContentContainer>
          <InputImage imageFile={imageFile} setImageFile={setImageFile} />
          <InputName name={roleName} setName={setRoleName} />
          <InputDescription
            description={roleDescription}
            setDescription={setRoleDescription}
            mt={6}
          />
        </ContentContainer>
        <SectionHeading>役割</SectionHeading>
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
        <SectionHeading>権限</SectionHeading>
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
            disabled={!roleName}
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
